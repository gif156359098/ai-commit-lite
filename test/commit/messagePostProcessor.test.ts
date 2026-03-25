import assert from 'node:assert/strict';
import test from 'node:test';
import { AIProvider, CommitContext } from '../../src/ai/providers';
import { PreparedGitDiff } from '../../src/git/diff';
import {
  buildRepairSummary,
  isDetailedCommitMessage,
  normalizeConciseCommitMessage,
  postProcessCommitMessage
} from '../../src/commit/messagePostProcessor';

class FakeProvider implements AIProvider {
  public readonly calls: Array<{ diff: string; context: CommitContext }> = [];

  constructor(private readonly response: string) {}

  async generateCommitMessage(diff: string, context: CommitContext): Promise<string> {
    this.calls.push({ diff, context });
    return this.response;
  }
}

function createContext(overrides: Partial<CommitContext> = {}): CommitContext {
  return {
    language: 'zh-cn',
    useGitmoji: false,
    conventionalCommits: true,
    commitMessageStyle: 'detailed',
    temperature: 0.7,
    maxTokens: 1000,
    customSystemPrompt: '',
    ...overrides
  };
}

function createPreparedDiff(fileCount: number = 2): PreparedGitDiff {
  const files = Array.from({ length: fileCount }, (_, index) => ({
    status: 'M',
    path: `src/file-${index + 1}.ts`,
    additions: index + 1,
    deletions: index,
    changes: '',
    isBinary: false
  }));

  return {
    raw: 'diff --git a/src/file-1.ts b/src/file-1.ts',
    files,
    summary: `${fileCount} file(s) changed`,
    prompt: 'staged changes',
    report: {
      totalFiles: fileCount,
      includedDiffFiles: fileCount,
      filteredFiles: 0,
      truncatedFiles: 0,
      summarizedFiles: 0,
      totalPromptCharacters: 120
    }
  };
}

test('isDetailedCommitMessage accepts subject plus bullet list', () => {
  assert.equal(
    isDetailedCommitMessage('feat: add profile manager\n\n- support providers\n- improve onboarding'),
    true
  );
});

test('normalizeConciseCommitMessage keeps only the first meaningful line', () => {
  assert.equal(
    normalizeConciseCommitMessage('\n\nfeat: add profile manager\n\n- extra details'),
    'feat: add profile manager'
  );
});

test('buildRepairSummary caps listed files and adds overflow note', () => {
  const summary = buildRepairSummary(createPreparedDiff(12));

  assert.match(summary, /Key staged files:/);
  assert.match(summary, /- \.\.\. 2 more file\(s\) not shown/);
});

test('postProcessCommitMessage requests one repair for invalid detailed messages', async () => {
  const provider = new FakeProvider('feat: add profile manager\n\n- support providers\n- improve onboarding');
  const preparedDiff = createPreparedDiff();

  const commitMessage = await postProcessCommitMessage({
    provider,
    context: createContext(),
    preparedDiff,
    commitMessage: 'feat: add profile manager'
  });

  assert.equal(commitMessage, 'feat: add profile manager\n\n- support providers\n- improve onboarding');
  assert.equal(provider.calls.length, 1);
  assert.equal(provider.calls[0]?.context.formatRepairDraft, 'feat: add profile manager');
});

test('postProcessCommitMessage falls back to the original draft when repair is still invalid', async () => {
  const provider = new FakeProvider('feat: still too short');

  const commitMessage = await postProcessCommitMessage({
    provider,
    context: createContext(),
    preparedDiff: createPreparedDiff(),
    commitMessage: 'feat: original draft'
  });

  assert.equal(commitMessage, 'feat: original draft');
});

test('postProcessCommitMessage adds gitmoji after concise normalization', async () => {
  const provider = new FakeProvider('unused');

  const commitMessage = await postProcessCommitMessage({
    provider,
    context: createContext({
      commitMessageStyle: 'concise',
      useGitmoji: true
    }),
    preparedDiff: createPreparedDiff(),
    commitMessage: 'feat: add profile manager\n\n- extra details'
  });

  assert.equal(commitMessage, '✨ feat: add profile manager');
  assert.equal(provider.calls.length, 0);
});

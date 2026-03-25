import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildCommitStyleInstruction,
  buildSystemPrompt,
  buildUserPrompt,
  getLanguageInstructions,
  getLanguageName
} from '../../src/ai/promptBuilder';
import type { CommitContext } from '../../src/ai/providers';

function createContext(overrides: Partial<CommitContext> = {}): CommitContext {
  return {
    language: 'zh-cn',
    useGitmoji: true,
    conventionalCommits: true,
    commitMessageStyle: 'detailed',
    temperature: 0.7,
    maxTokens: 1000,
    customSystemPrompt: '',
    ...overrides
  };
}

test('getLanguageName and getLanguageInstructions fall back to English for unknown locales', () => {
  assert.equal(getLanguageName('unknown-locale'), 'English');
  assert.equal(getLanguageInstructions('unknown-locale'), '\nWrite full commit message in English.');
});

test('buildCommitStyleInstruction changes between detailed and concise formats', () => {
  assert.match(buildCommitStyleInstruction('detailed'), /2 to 5 bullet points/);
  assert.match(buildCommitStyleInstruction('concise'), /single subject line only/);
});

test('buildSystemPrompt includes language, conventional commits, gitmoji, and custom instructions', () => {
  const prompt = buildSystemPrompt(createContext({
    customSystemPrompt: 'Prefer business-facing wording.'
  }));

  assert.match(prompt, /Simplified Chinese/);
  assert.match(prompt, /Follow the Conventional Commits specification/);
  assert.match(prompt, /Include a relevant Gitmoji/);
  assert.match(prompt, /Prefer business-facing wording\./);
});

test('buildSystemPrompt switches to repair instructions when formatRepairDraft is present', () => {
  const prompt = buildSystemPrompt(createContext({
    formatRepairDraft: 'feat: add onboarding'
  }));

  assert.match(prompt, /You rewrite git commit message drafts/);
  assert.match(prompt, /Preserve the facts from the existing draft/);
  assert.doesNotMatch(prompt, /You are an expert at writing clear, concise git commit messages/);
});

test('buildUserPrompt uses repair mode wording when formatRepairDraft is present', () => {
  const prompt = buildUserPrompt('summary text', createContext({
    formatRepairDraft: 'feat: add onboarding'
  }));

  assert.match(prompt, /Rewrite the git commit draft below/);
  assert.match(prompt, /Current draft:\nfeat: add onboarding/);
  assert.match(prompt, /Staged change summary:\nsummary text/);
});

test('buildUserPrompt uses non-conventional wording when conventional commits are disabled', () => {
  const prompt = buildUserPrompt('diff content', createContext({
    language: 'en',
    conventionalCommits: false,
    useGitmoji: false,
    commitMessageStyle: 'concise'
  }));

  assert.match(prompt, /Generate exactly one git commit message in English/);
  assert.match(prompt, /Do not use English unless the target language is English/);
  assert.doesNotMatch(prompt, /keep the type token in English/);
});

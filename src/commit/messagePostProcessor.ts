import { AIProvider, CommitContext } from '../ai/providers';
import { PreparedGitDiff } from '../git/diff';
import { addGitmojiToMessage } from './gitmoji';

export interface PostProcessCommitMessageOptions {
  provider: AIProvider;
  context: CommitContext;
  preparedDiff: PreparedGitDiff;
  commitMessage: string;
}

export async function postProcessCommitMessage(
  options: PostProcessCommitMessageOptions
): Promise<string> {
  const { provider, context, preparedDiff } = options;
  let commitMessage = options.commitMessage;

  if (context.commitMessageStyle === 'concise') {
    commitMessage = normalizeConciseCommitMessage(commitMessage);
  } else if (!isDetailedCommitMessage(commitMessage)) {
    const repairedCommitMessage = await provider.generateCommitMessage(
      buildRepairSummary(preparedDiff),
      {
        ...context,
        formatRepairDraft: commitMessage
      }
    );

    if (isDetailedCommitMessage(repairedCommitMessage)) {
      commitMessage = repairedCommitMessage;
    }
  }

  if (context.useGitmoji) {
    commitMessage = addGitmojiToMessage(commitMessage);
  }

  return commitMessage;
}

export function isDetailedCommitMessage(message: string): boolean {
  const normalizedMessage = message.replace(/\r\n/g, '\n').trim();
  const lines = normalizedMessage.split('\n');

  if (lines.length < 4 || !lines[0]?.trim()) {
    return false;
  }

  if (lines[1].trim() !== '') {
    return false;
  }

  const bulletLines = lines.slice(2).filter((line) => line.trim().length > 0);
  return bulletLines.length >= 2
    && bulletLines.length <= 5
    && bulletLines.every((line) => line.trimStart().startsWith('- '));
}

export function normalizeConciseCommitMessage(message: string): string {
  const firstMeaningfulLine = message
    .replace(/\r\n/g, '\n')
    .split('\n')
    .find((line) => line.trim().length > 0);

  return (firstMeaningfulLine || message).trim();
}

export function buildRepairSummary(preparedDiff: PreparedGitDiff): string {
  const files = preparedDiff.files.slice(0, 10).map((file) => {
    const stats = file.isBinary ? 'binary' : `+${file.additions} -${file.deletions}`;
    return `- ${file.status} ${file.path} (${stats})`;
  });
  const remainingCount = preparedDiff.files.length - files.length;

  if (remainingCount > 0) {
    files.push(`- ... ${remainingCount} more file(s) not shown`);
  }

  return [
    'Staged changes overview:',
    `- ${preparedDiff.summary}`,
    '',
    'Key staged files:',
    ...files
  ].join('\n').trim();
}

import { AIProvider } from '../ai/providers';
import { createAIProvider } from '../ai/providerFactory';
import { AICommitConfigWithProfile } from '../types/profile';
import { CommitContext } from '../ai/providers';
import { postProcessCommitMessage } from './messagePostProcessor';
import { DiffContextReport, PreparedGitDiff, getPreparedStagedDiff } from '../git/diff';
import { t } from '../i18n';

export interface CommitGenerationResult {
  commitMessage: string;
  diffContextReport: DiffContextReport;
}

export interface PreparedCommitGeneration {
  context: CommitContext;
  provider: AIProvider;
  preparedDiff: PreparedGitDiff;
}

export async function prepareCommitGeneration(
  repositoryRoot: string,
  config: AICommitConfigWithProfile,
  abortSignal?: AbortSignal
): Promise<PreparedCommitGeneration> {
  const context: CommitContext = {
    language: config.language,
    useGitmoji: config.useGitmoji,
    conventionalCommits: config.conventionalCommits,
    commitMessageStyle: config.commitMessageStyle,
    temperature: config.temperature,
    maxTokens: config.maxTokens,
    customSystemPrompt: config.customSystemPrompt
  };

  const preparedDiff = await getPreparedStagedDiff(repositoryRoot, {
    excludePatterns: config.contextExcludePatterns,
    maxDiffCharacters: config.maxDiffCharacters,
    maxFileDiffCharacters: config.maxFileDiffCharacters
  }, abortSignal);

  if (!preparedDiff.prompt || preparedDiff.prompt.trim().length === 0) {
    throw new Error(t('noStagedChanges'));
  }

  return {
    context,
    provider: createAIProvider(config),
    preparedDiff
  };
}

type LogFn = (message: string) => void;

export async function generateCommitMessageFromPrepared(
  preparedGeneration: PreparedCommitGeneration,
  abortSignal?: AbortSignal,
  onLog?: LogFn
): Promise<CommitGenerationResult> {
  const { context, preparedDiff, provider } = preparedGeneration;
  const initialCommitMessage = await provider.generateCommitMessage(preparedDiff.prompt, context, abortSignal);
  const commitMessage = await postProcessCommitMessage({
    provider,
    context,
    preparedDiff,
    commitMessage: initialCommitMessage
  }, abortSignal, onLog);

  return {
    commitMessage,
    diffContextReport: preparedDiff.report
  };
}

// createAIProvider moved to ../ai/providerFactory

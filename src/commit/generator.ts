import { AnthropicProvider } from '../ai/anthropic';
import { CohereProvider } from '../ai/cohere';
import { OpenAIProvider } from '../ai/openai';
import { DeepSeekProvider } from '../ai/deepseek';
import { OpenAICompatibleProvider } from '../ai/openaiCompatible';
import { AzureOpenAIProvider } from '../ai/azure';
import { GeminiProvider } from '../ai/gemini';
import { AIProvider } from '../ai/providers';
import { getProviderDefinition, normalizeProviderType } from '../ai/providerRegistry';
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

export async function generateCommitMessage(
  config: AICommitConfigWithProfile
): Promise<CommitGenerationResult> {
  const preparedGeneration = await prepareCommitGeneration(config);
  return generateCommitMessageFromPrepared(preparedGeneration);
}

export async function prepareCommitGeneration(
  config: AICommitConfigWithProfile
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

  const preparedDiff = await getPreparedStagedDiff({
    excludePatterns: config.contextExcludePatterns,
    maxDiffCharacters: config.maxDiffCharacters,
    maxFileDiffCharacters: config.maxFileDiffCharacters
  });

  if (!preparedDiff.prompt || preparedDiff.prompt.trim().length === 0) {
    throw new Error(t('noStagedChanges'));
  }

  return {
    context,
    provider: createAIProvider(config),
    preparedDiff
  };
}

export async function generateCommitMessageFromPrepared(
  preparedGeneration: PreparedCommitGeneration,
  abortSignal?: AbortSignal
): Promise<CommitGenerationResult> {
  const { context, preparedDiff, provider } = preparedGeneration;
  const initialCommitMessage = await provider.generateCommitMessage(preparedDiff.prompt, context, abortSignal);
  const commitMessage = await postProcessCommitMessage({
    provider,
    context,
    preparedDiff,
    commitMessage: initialCommitMessage
  }, abortSignal);

  return {
    commitMessage,
    diffContextReport: preparedDiff.report
  };
}

function createAIProvider(config: AICommitConfigWithProfile): AIProvider {
  const { profile, apiKey, apiEndpoint } = config;
  const provider = normalizeProviderType(profile.provider);
  const providerDefinition = getProviderDefinition(provider);
  const endpoint = apiEndpoint || providerDefinition.defaultBaseUrl || '';

  switch (provider) {
    case 'openai':
      return new OpenAIProvider(apiKey, profile.model, endpoint);
    case 'deepseek':
      return new DeepSeekProvider(apiKey, profile.model, endpoint);
    case 'azure':
      return new AzureOpenAIProvider(apiKey, profile.model, endpoint);
    case 'gemini':
      return new GeminiProvider(apiKey, profile.model, endpoint);
    case 'anthropic':
      return new AnthropicProvider(apiKey, profile.model, endpoint);
    case 'cohere':
      return new CohereProvider(apiKey, profile.model, endpoint);
    case 'mistral':
    case 'dashscope':
    case 'openai-compatible':
      return new OpenAICompatibleProvider(
        apiKey,
        profile.model,
        {
          providerName: providerDefinition.label,
          defaultEndpoint: providerDefinition.defaultBaseUrl || endpoint
        },
        endpoint
      );
    default:
      throw new Error(`Unsupported API provider: ${provider}`);
  }
}

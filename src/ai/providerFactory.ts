import { AnthropicProvider } from './anthropic';
import { CohereProvider } from './cohere';
import { OpenAIProvider } from './openai';
import { DeepSeekProvider } from './deepseek';
import { OpenAICompatibleProvider } from './openaiCompatible';
import { AzureOpenAIProvider } from './azure';
import { GeminiProvider } from './gemini';
import { AIProvider } from './providers';
import { getProviderDefinition, normalizeProviderType } from './providerRegistry';
import { AICommitConfigWithProfile } from '../types/profile';

export function createAIProvider(config: AICommitConfigWithProfile): AIProvider {
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
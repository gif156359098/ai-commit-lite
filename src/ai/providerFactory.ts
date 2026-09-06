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

/**
 * 校验自定义 API 端点，防止 API key 被发送到非预期主机。
 *
 * 规则：
 * - 必须可解析为绝对 URL；
 * - 仅接受 https://（本机开发服务如 Ollama/LM Studio 允许 http://localhost）。
 */
export function validateProviderEndpoint(endpoint: string): void {
  if (!endpoint) {
    return;
  }

  let url: URL;
  try {
    url = new URL(endpoint);
  } catch {
    throw new Error('Invalid API endpoint URL: ' + endpoint);
  }

  if (url.protocol !== 'https:') {
    if (url.protocol !== 'http:') {
      throw new Error('Unsupported API endpoint protocol: ' + url.protocol + '. Use https://');
    }

    const host = url.hostname.replace(/^\[|\]$/g, '').toLowerCase();
    const isLocal = host === 'localhost' || host === '127.0.0.1' || host === '::1';
    if (!isLocal) {
      throw new Error('Insecure http:// endpoint is not allowed for non-local hosts: ' + endpoint);
    }
  }
}

export function createAIProvider(config: AICommitConfigWithProfile): AIProvider {
  const { profile, apiKey, apiEndpoint } = config;
  const provider = normalizeProviderType(profile.provider);
  const providerDefinition = getProviderDefinition(provider);
  const endpoint = apiEndpoint || providerDefinition.defaultBaseUrl || '';

  validateProviderEndpoint(endpoint);

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
      throw new Error('Unsupported API provider: ' + provider);
  }
}

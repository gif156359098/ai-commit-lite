import { MessageKey } from '../i18n';
import { AIProviderType } from '../types/profile';

export type NormalizedAIProviderType = Exclude<AIProviderType, 'custom'>;
export type ProviderBaseUrlMode = 'hidden' | 'required' | 'optional';
export type ProviderModelInputKind = 'model' | 'deployment';
export type ProviderEndpointHintMode =
  | 'official'
  | 'azure-resource'
  | 'custom-required'
  | 'custom-optional';

export interface ProviderDefinition {
  type: NormalizedAIProviderType;
  label: string;
  descriptionKey: MessageKey;
  audienceHintKey: MessageKey;
  defaultModel: string;
  modelPlaceholder: string;
  modelInputKind: ProviderModelInputKind;
  baseUrlMode: ProviderBaseUrlMode;
  endpointHintMode: ProviderEndpointHintMode;
  defaultBaseUrl?: string;
  baseUrlPlaceholder?: string;
}

const PROVIDER_DEFINITIONS: Record<NormalizedAIProviderType, ProviderDefinition> = {
  openai: {
    type: 'openai',
    label: 'OpenAI',
    descriptionKey: 'providerOpenaiDescription',
    audienceHintKey: 'providerOpenaiAudience',
    defaultModel: 'gpt-4.1-mini',
    modelPlaceholder: 'gpt-4.1-mini',
    modelInputKind: 'model',
    baseUrlMode: 'hidden',
    endpointHintMode: 'official',
    defaultBaseUrl: 'https://api.openai.com/v1'
  },
  azure: {
    type: 'azure',
    label: 'Azure OpenAI',
    descriptionKey: 'providerAzureDescription',
    audienceHintKey: 'providerAzureAudience',
    defaultModel: '',
    modelPlaceholder: 'your-deployment-name',
    modelInputKind: 'deployment',
    baseUrlMode: 'required',
    endpointHintMode: 'azure-resource',
    baseUrlPlaceholder: 'https://your-resource.openai.azure.com'
  },
  deepseek: {
    type: 'deepseek',
    label: 'DeepSeek',
    descriptionKey: 'providerDeepseekDescription',
    audienceHintKey: 'providerDeepseekAudience',
    defaultModel: 'deepseek-chat',
    modelPlaceholder: 'deepseek-chat',
    modelInputKind: 'model',
    baseUrlMode: 'hidden',
    endpointHintMode: 'official',
    defaultBaseUrl: 'https://api.deepseek.com/v1'
  },
  gemini: {
    type: 'gemini',
    label: 'Gemini',
    descriptionKey: 'providerGeminiDescription',
    audienceHintKey: 'providerGeminiAudience',
    defaultModel: 'gemini-2.5-flash',
    modelPlaceholder: 'gemini-2.5-flash',
    modelInputKind: 'model',
    baseUrlMode: 'hidden',
    endpointHintMode: 'official',
    defaultBaseUrl: 'https://generativelanguage.googleapis.com/v1beta'
  },
  anthropic: {
    type: 'anthropic',
    label: 'Anthropic',
    descriptionKey: 'providerAnthropicDescription',
    audienceHintKey: 'providerAnthropicAudience',
    defaultModel: 'claude-sonnet-4-20250514',
    modelPlaceholder: 'claude-sonnet-4-20250514',
    modelInputKind: 'model',
    baseUrlMode: 'hidden',
    endpointHintMode: 'official',
    defaultBaseUrl: 'https://api.anthropic.com'
  },
  cohere: {
    type: 'cohere',
    label: 'Cohere',
    descriptionKey: 'providerCohereDescription',
    audienceHintKey: 'providerCohereAudience',
    defaultModel: 'command-a-03-2025',
    modelPlaceholder: 'command-a-03-2025',
    modelInputKind: 'model',
    baseUrlMode: 'hidden',
    endpointHintMode: 'official',
    defaultBaseUrl: 'https://api.cohere.com'
  },
  mistral: {
    type: 'mistral',
    label: 'Mistral',
    descriptionKey: 'providerMistralDescription',
    audienceHintKey: 'providerMistralAudience',
    defaultModel: 'mistral-small-latest',
    modelPlaceholder: 'mistral-small-latest',
    modelInputKind: 'model',
    baseUrlMode: 'hidden',
    endpointHintMode: 'official',
    defaultBaseUrl: 'https://api.mistral.ai/v1'
  },
  dashscope: {
    type: 'dashscope',
    label: 'Qwen / DashScope',
    descriptionKey: 'providerDashscopeDescription',
    audienceHintKey: 'providerDashscopeAudience',
    defaultModel: 'qwen-plus',
    modelPlaceholder: 'qwen-plus',
    modelInputKind: 'model',
    baseUrlMode: 'optional',
    endpointHintMode: 'custom-optional',
    defaultBaseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    baseUrlPlaceholder: 'https://dashscope.aliyuncs.com/compatible-mode/v1'
  },
  'openai-compatible': {
    type: 'openai-compatible',
    label: 'OpenAI-Compatible',
    descriptionKey: 'providerOpenaiCompatibleDescription',
    audienceHintKey: 'providerOpenaiCompatibleAudience',
    defaultModel: '',
    modelPlaceholder: 'your-model-name',
    modelInputKind: 'model',
    baseUrlMode: 'required',
    endpointHintMode: 'custom-required',
    baseUrlPlaceholder: 'https://api.example.com/v1'
  }
};

const PROVIDER_ORDER: NormalizedAIProviderType[] = [
  'openai',
  'azure',
  'deepseek',
  'gemini',
  'anthropic',
  'cohere',
  'mistral',
  'dashscope',
  'openai-compatible'
];

export function normalizeProviderType(provider: AIProviderType): NormalizedAIProviderType {
  return provider === 'custom' ? 'openai-compatible' : provider;
}

export function isProviderType(value: string): value is AIProviderType {
  return value === 'custom' || value in PROVIDER_DEFINITIONS;
}

export function getProviderDefinition(provider: AIProviderType): ProviderDefinition {
  return PROVIDER_DEFINITIONS[normalizeProviderType(provider)];
}

export function getProviderDefinitions(): ProviderDefinition[] {
  return PROVIDER_ORDER.map((provider) => PROVIDER_DEFINITIONS[provider]);
}

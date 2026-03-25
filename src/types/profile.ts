import { AICommitConfig } from '../config/settingsTypes';

export type AIProviderType =
  | 'openai'
  | 'azure'
  | 'deepseek'
  | 'gemini'
  | 'anthropic'
  | 'cohere'
  | 'mistral'
  | 'dashscope'
  | 'openai-compatible'
  | 'custom';

export interface ModelProfile {
  id: string;
  label: string;
  provider: AIProviderType;
  model: string;
  baseUrl?: string;
}

export interface ProfileConfig {
  profiles: ModelProfile[];
  activeProfile: string;
  enableAutoFallback: boolean;
  profileFallbackOrder: string[];
}

export interface AICommitConfigWithProfile extends AICommitConfig {
  profile: ModelProfile;
  apiKey: string;
  apiEndpoint: string;
}

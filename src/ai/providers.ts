import axios, { AxiosInstance, CancelTokenSource } from 'axios';
import { CommitMessageStyle } from '../config/settingsTypes';
import {
  buildSystemPrompt,
  buildUserPrompt
} from './promptBuilder';

export interface AIProvider {
  generateCommitMessage(
    diff: string,
    context: CommitContext,
    abortSignal?: AbortSignal
  ): Promise<string>;
  cancel(): void;
}

export interface CommitContext {
  language: string;
  useGitmoji: boolean;
  conventionalCommits: boolean;
  commitMessageStyle: CommitMessageStyle;
  temperature: number;
  maxTokens: number;
  customSystemPrompt: string;
  formatRepairDraft?: string;
}

// Client cache for OpenAI-compatible providers
const clientCache = new Map<string, AxiosInstance>();

function getOrCreateOpenAICompatibleClient(apiKey: string, apiEndpoint: string): AxiosInstance {
  const cacheKey = `${apiEndpoint}:${apiKey.slice(0, 8)}`;
  let client = clientCache.get(cacheKey);
  if (client) {
    return client;
  }
  client = axios.create({
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    timeout: 60_000
  });
  clientCache.set(cacheKey, client);
  return client;
}

export function getOrCreateAnthropicClient(apiKey: string, apiEndpoint: string): AxiosInstance {
  const cacheKey = `anthropic:${apiEndpoint}:${apiKey.slice(0, 8)}`;
  let client = clientCache.get(cacheKey);
  if (client) {
    return client;
  }
  client = axios.create({
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'Content-Type': 'application/json'
    },
    timeout: 60_000
  });
  clientCache.set(cacheKey, client);
  return client;
}

export function getOrCreateGeminiClient(apiKey: string, apiEndpoint: string): AxiosInstance {
  const cacheKey = `gemini:${apiEndpoint}`;
  let client = clientCache.get(cacheKey);
  if (client) {
    return client;
  }
  client = axios.create({
    headers: {
      'Content-Type': 'application/json'
    },
    timeout: 60_000
  });
  clientCache.set(cacheKey, client);
  return client;
}

export function clearClientCache(): void {
  clientCache.clear();
}

export abstract class BaseAIProvider implements AIProvider {
  protected client: AxiosInstance;
  protected apiKey: string;
  protected model: string;
  protected apiEndpoint: string;
  private cancelTokenSource: CancelTokenSource | null = null;

  constructor(apiKey: string, model: string, apiEndpoint: string = '') {
    this.apiKey = apiKey;
    this.model = model;
    this.apiEndpoint = apiEndpoint;
    this.client = getOrCreateOpenAICompatibleClient(apiKey, apiEndpoint);
  }

  abstract generateCommitMessage(
    diff: string,
    context: CommitContext,
    abortSignal?: AbortSignal
  ): Promise<string>;

  cancel(): void {
    if (this.cancelTokenSource) {
      this.cancelTokenSource.cancel('Request cancelled by user');
      this.cancelTokenSource = null;
    }
  }

  protected createCancelToken(): CancelTokenSource {
    this.cancelTokenSource = axios.CancelToken.source();
    return this.cancelTokenSource;
  }

  protected clearCancelToken(): void {
    this.cancelTokenSource = null;
  }

  protected buildOpenAICompatibleChatPayload(
    systemPrompt: string,
    userPrompt: string,
    context: CommitContext,
    maxTokens: number
  ): Record<string, unknown> {
    return {
      model: this.model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: context.temperature,
      max_tokens: maxTokens
    };
  }

  protected getRetryMaxTokens(maxTokens: number): number | undefined {
    const retryMaxTokens = Math.min(Math.max(maxTokens * 2, 1200), 4000);
    return retryMaxTokens > maxTokens ? retryMaxTokens : undefined;
  }

  protected buildSystemPrompt(context: CommitContext): string {
    return buildSystemPrompt(context);
  }

  protected buildUserPrompt(diff: string, context: CommitContext): string {
    return buildUserPrompt(diff, context);
  }

  protected resolveOpenAICompatibleEndpoint(fallbackEndpoint: string): string {
    const rawEndpoint = (this.apiEndpoint || fallbackEndpoint).trim();

    try {
      const url = new URL(rawEndpoint);
      let pathname = url.pathname.replace(/\/+$/g, '');

      if (pathname.endsWith('/chat/completions')) {
        pathname = pathname.slice(0, -'/chat/completions'.length);
      } else if (!pathname) {
        pathname = '/v1';
      }

      url.pathname = pathname || '/v1';

      return url.toString().replace(/\/+$/g, '');
    } catch {
      return rawEndpoint.replace(/\/+$/g, '');
    }
  }
}

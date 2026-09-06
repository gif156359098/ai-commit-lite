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

/**
 * OpenAI 兼容 chat/completions 请求体的采样参数策略。
 * 不同"模型代际"的参数要求不同：
 * - 传统模型（gpt-4/4o/4.1、DeepSeek、Mistral、Qwen 等）：max_tokens + temperature；
 * - OpenAI 新一代推理模型（GPT-5/5.6 系列）：max_completion_tokens，且不支持 temperature。
 */
export interface ChatPayloadOptions {
  /** 使用 max_completion_tokens（OpenAI 新一代模型），而非 max_tokens */
  useMaxCompletionTokens?: boolean;
  /** 是否包含 temperature（推理模型不支持该参数时传 false） */
  includeTemperature?: boolean;
}

// Client cache for OpenAI-compatible providers
const clientCache = new Map<string, AxiosInstance>();

function buildClientCacheKey(prefix: string, apiEndpoint: string, apiKey: string): string {
  return `${prefix}:${apiEndpoint}:${apiKey.length}:${apiKey.slice(-4)}`;
}

function getOrCreateOpenAICompatibleClient(apiKey: string, apiEndpoint: string): AxiosInstance {
  const cacheKey = buildClientCacheKey('openai', apiEndpoint, apiKey);
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
  const cacheKey = buildClientCacheKey('anthropic', apiEndpoint, apiKey);
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
    maxTokens: number,
    options: ChatPayloadOptions = {}
  ): Record<string, unknown> {
    const payload: Record<string, unknown> = {
      model: this.model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ]
    };

    // OpenAI 新一代模型（GPT-5/5.6 系列）要求 max_completion_tokens 且拒绝 temperature，
    // 其余 OpenAI 兼容服务使用传统的 max_tokens + temperature。
    if (options.useMaxCompletionTokens) {
      payload['max_completion_tokens'] = maxTokens;
    } else {
      payload['max_tokens'] = maxTokens;
    }

    if (options.includeTemperature !== false) {
      payload['temperature'] = context.temperature;
    }

    return payload;
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

import axios, { AxiosInstance } from 'axios';
import { CommitMessageStyle } from '../config/settingsTypes';
import {
  buildSystemPrompt,
  buildUserPrompt
} from './promptBuilder';

export interface AIProvider {
  generateCommitMessage(diff: string, context: CommitContext): Promise<string>;
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

export abstract class BaseAIProvider implements AIProvider {
  protected client: AxiosInstance;
  protected apiKey: string;
  protected model: string;
  protected apiEndpoint: string;

  constructor(apiKey: string, model: string, apiEndpoint: string = '') {
    this.apiKey = apiKey;
    this.model = model;
    this.apiEndpoint = apiEndpoint;
    this.client = axios.create({
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });
  }

  abstract generateCommitMessage(diff: string, context: CommitContext): Promise<string>;

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

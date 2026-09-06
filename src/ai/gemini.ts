import axios from 'axios';

import { BaseAIProvider, CommitContext, getOrCreateGeminiClient } from './providers';
import { cleanCommitMessage, extractGeminiMessage, getProviderErrorMessage } from './response';
import { isCancellationError } from '../utils/cancellation';

export class GeminiProvider extends BaseAIProvider {
  constructor(
    apiKey: string,
    model: string = 'gemini-pro',
    apiEndpoint: string = 'https://generativelanguage.googleapis.com/v1beta'
  ) {
    super(apiKey, model, apiEndpoint);
    this.client = getOrCreateGeminiClient(apiKey, apiEndpoint);
  }

  async generateCommitMessage(diff: string, context: CommitContext, abortSignal?: AbortSignal): Promise<string> {
    const systemPrompt = this.buildSystemPrompt(context);
    const userPrompt = this.buildUserPrompt(diff, context);
    const cancelTokenSource = this.createCancelToken();

    try {
      const response = await this.client.post(
        `${this.apiEndpoint}/models/${this.model}:generateContent`,
        {
          contents: [
            {
              parts: [
                { text: systemPrompt },
                { text: `\n${userPrompt}` }
              ]
            }
          ],
          generationConfig: {
            temperature: context.temperature,
            maxOutputTokens: context.maxTokens
          }
        },
        {
          // 官方推荐使用 x-goog-api-key 请求头而非 URL query：避免 key 被
          // 代理/访问日志/诊断链路记录，也避免 axios 跨域重定向转发 query。
          headers: { 'x-goog-api-key': this.apiKey },
          cancelToken: cancelTokenSource.token,
          signal: abortSignal
        }
      );

      const message = extractGeminiMessage(response.data);
      this.clearCancelToken();
      return cleanCommitMessage(message);
    } catch (error: any) {
      this.clearCancelToken();
      if (isCancellationError(error)) {
        throw error;
      }

      throw new Error(`Gemini API error: ${getProviderErrorMessage(error)}`);
    }
  }
}

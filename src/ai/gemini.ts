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
        `${this.apiEndpoint}/models/${this.model}:generateContent?key=${this.apiKey}`,
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

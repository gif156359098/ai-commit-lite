import axios from 'axios';

import { BaseAIProvider, CommitContext } from './providers';
import { cleanCommitMessage, extractGeminiMessage, getProviderErrorMessage } from './response';

export class GeminiProvider extends BaseAIProvider {
  constructor(
    apiKey: string,
    model: string = 'gemini-pro',
    apiEndpoint: string = 'https://generativelanguage.googleapis.com/v1beta'
  ) {
    super(apiKey, model, apiEndpoint);
    this.client = axios.create({
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }

  async generateCommitMessage(diff: string, context: CommitContext): Promise<string> {
    const systemPrompt = this.buildSystemPrompt(context);
    const userPrompt = this.buildUserPrompt(diff, context);

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
        }
      );

      const message = extractGeminiMessage(response.data);
      return cleanCommitMessage(message);
    } catch (error: any) {
      throw new Error(`Gemini API error: ${getProviderErrorMessage(error)}`);
    }
  }
}

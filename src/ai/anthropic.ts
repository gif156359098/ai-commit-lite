import axios from 'axios';

import { BaseAIProvider, CommitContext } from './providers';
import {
  cleanCommitMessage,
  extractOpenAICompatibleMessage,
  getProviderErrorMessage
} from './response';

export class AnthropicProvider extends BaseAIProvider {
  constructor(
    apiKey: string,
    model: string,
    apiEndpoint: string = 'https://api.anthropic.com'
  ) {
    super(apiKey, model, apiEndpoint);
    this.client = axios.create({
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json'
      }
    });
  }

  async generateCommitMessage(diff: string, context: CommitContext): Promise<string> {
    const systemPrompt = this.buildSystemPrompt(context);
    const userPrompt = this.buildUserPrompt(diff, context);

    try {
      const response = await this.client.post(`${this.apiEndpoint}/v1/messages`, {
        model: this.model,
        system: systemPrompt,
        messages: [
          { role: 'user', content: userPrompt }
        ],
        max_tokens: context.maxTokens,
        temperature: context.temperature
      });

      const message = extractOpenAICompatibleMessage(response.data, this.apiEndpoint, context.maxTokens);
      return cleanCommitMessage(message);
    } catch (error: any) {
      throw new Error(`Anthropic API error: ${getProviderErrorMessage(error, this.apiEndpoint)}`);
    }
  }
}

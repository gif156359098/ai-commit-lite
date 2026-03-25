import { BaseAIProvider, CommitContext } from './providers';
import {
  cleanCommitMessage,
  extractOpenAICompatibleMessage,
  getProviderErrorMessage
} from './response';

export class CohereProvider extends BaseAIProvider {
  constructor(
    apiKey: string,
    model: string,
    apiEndpoint: string = 'https://api.cohere.com'
  ) {
    super(apiKey, model, apiEndpoint);
  }

  async generateCommitMessage(diff: string, context: CommitContext): Promise<string> {
    const systemPrompt = this.buildSystemPrompt(context);
    const userPrompt = this.buildUserPrompt(diff, context);

    try {
      const response = await this.client.post(`${this.apiEndpoint}/v2/chat`, {
        model: this.model,
        stream: false,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: context.temperature,
        max_tokens: context.maxTokens
      });

      const message = extractOpenAICompatibleMessage(response.data, this.apiEndpoint, context.maxTokens);
      return cleanCommitMessage(message);
    } catch (error: any) {
      throw new Error(`Cohere API error: ${getProviderErrorMessage(error, this.apiEndpoint)}`);
    }
  }
}

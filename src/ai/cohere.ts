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

  async generateCommitMessage(diff: string, context: CommitContext, abortSignal?: AbortSignal): Promise<string> {
    const systemPrompt = this.buildSystemPrompt(context);
    const userPrompt = this.buildUserPrompt(diff, context);
    const cancelTokenSource = this.createCancelToken();

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
      }, {
        cancelToken: cancelTokenSource.token,
        signal: abortSignal
      });

      const message = extractOpenAICompatibleMessage(response.data, this.apiEndpoint, context.maxTokens);
      this.clearCancelToken();
      return cleanCommitMessage(message);
    } catch (error: any) {
      this.clearCancelToken();
      throw new Error(`Cohere API error: ${getProviderErrorMessage(error, this.apiEndpoint)}`);
    }
  }
}

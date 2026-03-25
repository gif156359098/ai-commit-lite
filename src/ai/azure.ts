import { BaseAIProvider, CommitContext } from './providers';
import {
  cleanCommitMessage,
  extractOpenAICompatibleMessage,
  getProviderErrorMessage,
  shouldRetryOpenAICompatibleMessage
} from './response';

export class AzureOpenAIProvider extends BaseAIProvider {
  constructor(apiKey: string, model: string, apiEndpoint: string) {
    if (!apiEndpoint) {
      throw new Error('API endpoint is required for Azure OpenAI');
    }
    super(apiKey, model, apiEndpoint);
  }

  async generateCommitMessage(diff: string, context: CommitContext): Promise<string> {
    const systemPrompt = this.buildSystemPrompt(context);
    const userPrompt = this.buildUserPrompt(diff, context);

    try {
      const requestUrl = `${this.apiEndpoint}/openai/deployments/${this.model}/chat/completions?api-version=2023-05-15`;
      const requestConfig = {
        headers: {
          'api-key': this.apiKey
        }
      };
      const response = await this.client.post(
        requestUrl,
        {
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          temperature: context.temperature,
          max_tokens: context.maxTokens
        },
        requestConfig
      );

      let message: string;

      try {
        message = extractOpenAICompatibleMessage(
          response.data,
          this.apiEndpoint,
          context.maxTokens
        );
      } catch (error: any) {
        const retryMaxTokens = this.getRetryMaxTokens(context.maxTokens);

        if (!retryMaxTokens || !shouldRetryOpenAICompatibleMessage(response.data)) {
          throw error;
        }

        const retryResponse = await this.client.post(
          requestUrl,
          {
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userPrompt }
            ],
            temperature: context.temperature,
            max_tokens: retryMaxTokens
          },
          requestConfig
        );

        message = extractOpenAICompatibleMessage(
          retryResponse.data,
          this.apiEndpoint,
          retryMaxTokens
        );
      }

      return cleanCommitMessage(message);
    } catch (error: any) {
      throw new Error(`Azure OpenAI API error: ${getProviderErrorMessage(error, this.apiEndpoint)}`);
    }
  }
}

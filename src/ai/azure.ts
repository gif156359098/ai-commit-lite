import { AZURE_API_VERSION } from './constants';
import { BaseAIProvider, CommitContext } from './providers';
import {
  cleanCommitMessage,
  extractOpenAICompatibleMessage,
  getProviderErrorMessage,
  shouldRetryOpenAICompatibleMessage
} from './response';
import { isCancellationError } from '../utils/cancellation';

export class AzureOpenAIProvider extends BaseAIProvider {
  constructor(apiKey: string, model: string, apiEndpoint: string) {
    if (!apiEndpoint) {
      throw new Error('API endpoint is required for Azure OpenAI');
    }
    super(apiKey, model, apiEndpoint);
  }

  async generateCommitMessage(diff: string, context: CommitContext, abortSignal?: AbortSignal): Promise<string> {
    const systemPrompt = this.buildSystemPrompt(context);
    const userPrompt = this.buildUserPrompt(diff, context);
    const cancelTokenSource = this.createCancelToken();

    try {
      const requestUrl = `${this.apiEndpoint}/openai/deployments/${this.model}/chat/completions?api-version=${AZURE_API_VERSION}`;
      const requestConfig = {
        headers: {
          'api-key': this.apiKey
        },
        cancelToken: cancelTokenSource.token,
        signal: abortSignal
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

      this.clearCancelToken();
      return cleanCommitMessage(message);
    } catch (error: any) {
      this.clearCancelToken();
      if (isCancellationError(error)) {
        throw error;
      }

      throw new Error(`Azure OpenAI API error: ${getProviderErrorMessage(error, this.apiEndpoint)}`);
    }
  }
}

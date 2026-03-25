import { BaseAIProvider, CommitContext } from './providers';
import {
  cleanCommitMessage,
  extractOpenAICompatibleMessage,
  getProviderErrorMessage,
  shouldRetryOpenAICompatibleMessage
} from './response';

export interface OpenAICompatibleProviderOptions {
  providerName: string;
  defaultEndpoint: string;
}

export class OpenAICompatibleProvider extends BaseAIProvider {
  private readonly providerName: string;
  private readonly defaultEndpoint: string;

  constructor(
    apiKey: string,
    model: string,
    options: OpenAICompatibleProviderOptions,
    apiEndpoint: string = ''
  ) {
    super(apiKey, model, apiEndpoint);
    this.providerName = options.providerName;
    this.defaultEndpoint = options.defaultEndpoint;
  }

  protected getProviderName(): string {
    return this.providerName;
  }

  protected getDefaultEndpoint(): string {
    return this.defaultEndpoint;
  }

  async generateCommitMessage(diff: string, context: CommitContext): Promise<string> {
    const systemPrompt = this.buildSystemPrompt(context);
    const userPrompt = this.buildUserPrompt(diff, context);
    const endpoint = this.resolveOpenAICompatibleEndpoint(this.getDefaultEndpoint());

    try {
      const response = await this.client.post(
        `${endpoint}/chat/completions`,
        this.buildOpenAICompatibleChatPayload(
          systemPrompt,
          userPrompt,
          context,
          context.maxTokens
        )
      );

      let message: string;

      try {
        message = extractOpenAICompatibleMessage(response.data, endpoint, context.maxTokens);
      } catch (error: any) {
        const retryMaxTokens = this.getRetryMaxTokens(context.maxTokens);

        if (!retryMaxTokens || !shouldRetryOpenAICompatibleMessage(response.data)) {
          throw error;
        }

        const retryResponse = await this.client.post(
          `${endpoint}/chat/completions`,
          this.buildOpenAICompatibleChatPayload(
            systemPrompt,
            userPrompt,
            context,
            retryMaxTokens
          )
        );

        message = extractOpenAICompatibleMessage(
          retryResponse.data,
          endpoint,
          retryMaxTokens
        );
      }

      return cleanCommitMessage(message);
    } catch (error: any) {
      throw new Error(`${this.getProviderName()} API error: ${getProviderErrorMessage(error, endpoint)}`);
    }
  }
}

import { BaseAIProvider, ChatPayloadOptions, CommitContext } from './providers';
import {
  cleanCommitMessage,
  extractOpenAICompatibleMessage,
  getProviderErrorMessage,
  shouldRetryOpenAICompatibleMessage
} from './response';
import { isCancellationError } from '../utils/cancellation';

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

  /**
   * 采样参数策略。默认使用传统 max_tokens + temperature；
   * OpenAI 官方新一代模型（GPT-5/5.6）覆写为
   * max_completion_tokens 且不带 temperature。
   */
  protected getChatPayloadOptions(): ChatPayloadOptions {
    return {};
  }

  protected getProviderName(): string {
    return this.providerName;
  }

  protected getDefaultEndpoint(): string {
    return this.defaultEndpoint;
  }

  async generateCommitMessage(diff: string, context: CommitContext, abortSignal?: AbortSignal): Promise<string> {
    const systemPrompt = this.buildSystemPrompt(context);
    const userPrompt = this.buildUserPrompt(diff, context);
    const endpoint = this.resolveOpenAICompatibleEndpoint(this.getDefaultEndpoint());
    const cancelTokenSource = this.createCancelToken();

    try {
      const chatPayloadOptions = this.getChatPayloadOptions();

      const response = await this.client.post(
        `${endpoint}/chat/completions`,
        this.buildOpenAICompatibleChatPayload(
          systemPrompt,
          userPrompt,
          context,
          context.maxTokens,
          chatPayloadOptions
        ),
        {
          cancelToken: cancelTokenSource.token,
          signal: abortSignal
        }
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
            retryMaxTokens,
            chatPayloadOptions
          ),
          {
            cancelToken: cancelTokenSource.token,
            signal: abortSignal
          }
        );

        message = extractOpenAICompatibleMessage(
          retryResponse.data,
          endpoint,
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

      throw new Error(`${this.getProviderName()} API error: ${getProviderErrorMessage(error, endpoint)}`);
    }
  }
}

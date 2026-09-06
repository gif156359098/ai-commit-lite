import { OpenAICompatibleProvider } from './openaiCompatible';
import { ChatPayloadOptions } from './providers';

export class OpenAIProvider extends OpenAICompatibleProvider {
  constructor(apiKey: string, model: string, apiEndpoint: string = 'https://api.openai.com/v1') {
    super(
      apiKey,
      model,
      {
        providerName: 'OpenAI',
        defaultEndpoint: 'https://api.openai.com/v1'
      },
      apiEndpoint
    );
  }

  /**
   * OpenAI 新一代模型（GPT-5/5.6 系列，默认 gpt-5.6-terra）：
   * - 使用 max_completion_tokens（max_tokens 已弃用且不映射）；
   * - 拒绝 temperature/top_p 参数。
   * 若用户手动配置旧一代模型（如 gpt-4.1-mini），OpenAI 依然接受
   * max_completion_tokens 并忽略无 temperature，不影响使用。
   */
  protected getChatPayloadOptions(): ChatPayloadOptions {
    return {
      useMaxCompletionTokens: true,
      includeTemperature: false
    };
  }
}

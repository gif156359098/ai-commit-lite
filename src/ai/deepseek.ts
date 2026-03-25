import { OpenAICompatibleProvider } from './openaiCompatible';

export class DeepSeekProvider extends OpenAICompatibleProvider {
  constructor(apiKey: string, model: string = 'deepseek-chat', apiEndpoint: string = 'https://api.deepseek.com/v1') {
    super(
      apiKey,
      model,
      {
        providerName: 'DeepSeek',
        defaultEndpoint: 'https://api.deepseek.com/v1'
      },
      apiEndpoint
    );
  }
}

import { OpenAICompatibleProvider } from './openaiCompatible';

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
}

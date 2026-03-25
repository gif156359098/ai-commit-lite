import { ProviderEndpointHintMode } from '../ai/providerRegistry';

export function getProviderEndpointHintKey(mode: ProviderEndpointHintMode): string {
  switch (mode) {
    case 'official':
      return 'providerEndpointOfficial';
    case 'azure-resource':
      return 'providerEndpointAzureResource';
    case 'custom-required':
      return 'providerEndpointCustomRequired';
    case 'custom-optional':
      return 'providerEndpointCustomOptional';
    default:
      return 'providerEndpointOfficial';
  }
}

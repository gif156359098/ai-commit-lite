import assert from 'node:assert/strict';
import test from 'node:test';
import { getProviderEndpointHintKey } from '../../src/commands/profileManagerPanelProviderHints';

test('getProviderEndpointHintKey maps all endpoint hint modes to message keys', () => {
  assert.deepEqual(
    [
      getProviderEndpointHintKey('official'),
      getProviderEndpointHintKey('azure-resource'),
      getProviderEndpointHintKey('custom-required'),
      getProviderEndpointHintKey('custom-optional')
    ],
    [
      'providerEndpointOfficial',
      'providerEndpointAzureResource',
      'providerEndpointCustomRequired',
      'providerEndpointCustomOptional'
    ]
  );
});

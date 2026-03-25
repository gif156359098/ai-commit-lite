import assert from 'node:assert/strict';
import test from 'node:test';
import { ModelProfile } from '../../src/types/profile';
import {
  buildPanelProfileView,
  buildPanelProfileViews,
  buildProfileManagerPanelWebviewData
} from '../../src/commands/profileManagerPanelData';
import { PanelProviderView, WebviewI18n } from '../../src/commands/profileManagerPanelTypes';

const openaiProvider: PanelProviderView = {
  type: 'openai',
  label: 'OpenAI',
  description: 'Official OpenAI API',
  audienceHint: 'Best for direct OpenAI usage',
  endpointHint: 'Built-in endpoint',
  defaultModel: 'gpt-4.1-mini',
  modelPlaceholder: 'gpt-4.1-mini',
  modelInputKind: 'model',
  baseUrlMode: 'hidden',
  defaultBaseUrl: 'https://api.openai.com/v1',
  baseUrlPlaceholder: 'https://api.openai.com/v1'
};

const compatibleProvider: PanelProviderView = {
  type: 'openai-compatible',
  label: 'OpenAI-Compatible',
  description: 'Compatible endpoint',
  audienceHint: 'Best for gateways',
  endpointHint: 'Custom endpoint required',
  defaultModel: '',
  modelPlaceholder: 'your-model',
  modelInputKind: 'model',
  baseUrlMode: 'required',
  defaultBaseUrl: '',
  baseUrlPlaceholder: 'https://api.example.com/v1'
};

const i18n: WebviewI18n = {
  title: 'Profile Manager',
  subtitle: 'Manage providers',
  profileCount: '2 profiles',
  addProfileAction: 'Add profile',
  currentProfile: 'Current',
  useThisProfile: 'Use this profile',
  editAction: 'Edit',
  deleteAction: 'Delete',
  provider: 'Provider',
  model: 'Model',
  deploymentName: 'Deployment',
  apiEndpoint: 'API endpoint',
  apiKey: 'API key',
  profileDisplayName: 'Display name',
  profileDisplayNameHint: 'Shown in the list',
  modelNameHint: 'Model hint',
  deploymentNameHint: 'Deployment hint',
  apiEndpointHintRequired: 'Required',
  apiEndpointHintOptional: 'Optional',
  apiKeyHintNew: 'Stored securely',
  apiKeyHintExisting: 'Keep existing',
  cancelAction: 'Cancel',
  saveAction: 'Save',
  addProfileTitle: 'Add',
  editProfileTitle: 'Edit',
  editProfilePrompt: 'Edit prompt',
  deleteProfilePrompt: 'Delete prompt',
  profileNameRequired: 'Name required',
  profileModelRequired: 'Model required',
  profileBaseUrlRequired: 'Endpoint required',
  apiKeyRequired: 'API key required',
  noActiveProfileLabel: 'No active profile',
  profilesConfiguredLabel: 'Configured',
  activeProfileLabel: 'Active',
  profileManagerEmptyTitle: 'No profiles',
  profileManagerEmptyDescription: 'Create one',
  profileManagerReadyTitle: 'Ready',
  profileManagerReadyDescription: 'Ready description',
  providerSelectionHint: 'Choose one',
  providerAudienceLabel: 'Audience',
  providerEndpointRuleLabel: 'Endpoint rule',
  connectionDetailsSectionTitle: 'Connection details',
  closeAction: 'Close',
  secretStoredStatus: 'Stored',
  secretMissingStatus: 'Missing'
};

test('buildPanelProfileView merges profile, provider copy, and key state', () => {
  const profile = buildPanelProfileView({
    id: 'demo',
    label: 'Demo',
    provider: 'openai',
    model: 'gpt-4.1-mini'
  }, openaiProvider, true);

  assert.deepEqual(profile, {
    id: 'demo',
    label: 'Demo',
    provider: 'openai',
    model: 'gpt-4.1-mini',
    hasApiKey: true,
    providerLabel: 'OpenAI',
    providerDescription: 'Official OpenAI API',
    providerAudienceHint: 'Best for direct OpenAI usage',
    endpointHint: 'Built-in endpoint'
  });
});

test('buildPanelProfileViews resolves provider metadata and api key state for every profile', async () => {
  const profiles: ModelProfile[] = [
    { id: 'openai-1', label: 'Primary', provider: 'openai', model: 'gpt-4.1-mini' },
    {
      id: 'compat-1',
      label: 'Gateway',
      provider: 'openai-compatible',
      model: 'glm-4.5-flash',
      baseUrl: 'https://api.example.com/v1'
    }
  ];

  const views = await buildPanelProfileViews(
    profiles,
    [openaiProvider, compatibleProvider],
    async (profileId) => profileId === 'openai-1'
  );

  assert.equal(views[0].hasApiKey, true);
  assert.equal(views[0].providerLabel, 'OpenAI');
  assert.equal(views[1].hasApiKey, false);
  assert.equal(views[1].providerLabel, 'OpenAI-Compatible');
  assert.equal(views[1].endpointHint, 'Custom endpoint required');
});

test('buildProfileManagerPanelWebviewData assembles active profile and fallback labels correctly', async () => {
  const profiles: ModelProfile[] = [
    { id: 'openai-1', label: 'Primary', provider: 'openai', model: 'gpt-4.1-mini' }
  ];

  const webviewData = await buildProfileManagerPanelWebviewData({
    cspSource: 'vscode-webview://test',
    locale: 'en',
    activeProfile: profiles[0],
    initialAction: 'edit',
    i18n,
    providers: [openaiProvider],
    profiles,
    hasProfileApiKey: async () => true
  });

  assert.equal(webviewData.activeProfileId, 'openai-1');
  assert.equal(webviewData.activeProfileLabel, 'Primary');
  assert.equal(webviewData.initialAction, 'edit');
  assert.equal(webviewData.profiles.length, 1);
  assert.equal(webviewData.profiles[0].providerDescription, 'Official OpenAI API');

  const emptyData = await buildProfileManagerPanelWebviewData({
    cspSource: 'vscode-webview://test',
    locale: 'en',
    activeProfile: null,
    initialAction: 'default',
    i18n,
    providers: [openaiProvider],
    profiles: [],
    hasProfileApiKey: async () => false
  });

  assert.equal(emptyData.activeProfileId, '');
  assert.equal(emptyData.activeProfileLabel, 'No active profile');
});

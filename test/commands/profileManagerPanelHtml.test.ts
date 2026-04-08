import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildWebviewHtml,
  escapeHtml,
  serializeForWebviewScript
} from '../../src/commands/profileManagerPanelHtml';
import { BuildWebviewHtmlData } from '../../src/commands/profileManagerPanelTypes';

test('escapeHtml escapes html-sensitive characters', () => {
  assert.equal(
    escapeHtml(`<script>alert("&'")</script>`),
    '&lt;script&gt;alert(&quot;&amp;&#39;&quot;)&lt;/script&gt;'
  );
});

test('serializeForWebviewScript neutralizes script-breaking characters', () => {
  const serialized = serializeForWebviewScript({
    content: '</script><img src=x onerror=1>&\u2028\u2029'
  });

  assert.match(serialized, /\\u003c\/script\\u003e/);
  assert.match(serialized, /\\u0026/);
  assert.match(serialized, /\\u2028/);
  assert.match(serialized, /\\u2029/);
});

test('buildWebviewHtml serializes fallback settings into the page state', () => {
  const html = buildWebviewHtml(createWebviewHtmlData());

  assert.doesNotMatch(html, /<link rel="icon"/);
  assert.match(html, /<title>Profile Manager<\/title>/);
  assert.match(html, /"autoFallbackEnabled":false/);
  assert.match(html, /"fallbackPriority":1/);
});

function createWebviewHtmlData(): BuildWebviewHtmlData {
  return {
    cspSource: 'vscode-webview://test',
    locale: 'en',
    activeProfileLabel: 'Primary',
    activeProfileId: 'profile-1',
    initialAction: 'default',
    i18n: {
      title: 'Profile Manager',
      subtitle: 'Manage profiles',
      profileCount: '1 profile',
      addProfileAction: 'Add profile',
      currentProfile: 'Current profile',
      useThisProfile: 'Use this profile',
      editAction: 'Edit',
      deleteAction: 'Delete',
      provider: 'Provider',
      model: 'Model',
      deploymentName: 'Deployment',
      apiEndpoint: 'API endpoint',
      apiKey: 'API key',
      profileDisplayName: 'Display name',
      profileDisplayNameHint: 'Hint',
      modelNameHint: 'Hint',
      deploymentNameHint: 'Hint',
      apiEndpointHintRequired: 'Required',
      apiEndpointHintOptional: 'Optional',
      apiKeyHintNew: 'New key',
      apiKeyHintExisting: 'Keep existing',
      cancelAction: 'Cancel',
      saveAction: 'Save',
      addProfileTitle: 'Add profile',
      editProfileTitle: 'Edit profile',
      editProfilePrompt: 'Edit this profile',
      deleteProfilePrompt: 'Delete this profile',
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
      secretMissingStatus: 'Missing',
      openSettingsAction: 'Open settings',
      languageSetting: 'Language',
      fallbackOrderLabel: 'Fallback order',
      fallbackPriorityValue: 'Fallback #{priority}',
      defaultFallbackOrder: 'Default order',
      skippedWhileActive: 'Skipped while active',
      prioritizeFallbackAction: 'Prioritize',
      moveFallbackEarlierAction: 'Move earlier',
      moveFallbackLaterAction: 'Move later',
      useDefaultFallbackOrderAction: 'Use default order',
      autoFallbackDisabledNotice: 'Automatic fallback is off.'
    },
    providers: [],
    profiles: [{
      id: 'profile-2',
      label: 'Backup',
      provider: 'openai',
      model: 'gpt-4.1-mini',
      hasApiKey: true,
      providerLabel: 'OpenAI',
      providerDescription: 'Official OpenAI API',
      providerAudienceHint: 'Direct',
      endpointHint: 'Built-in',
      fallbackPriority: 1,
      hasExplicitFallbackPriority: true,
      isSkippedWhileActive: false
    }],
    currentLanguage: 'en',
    languageOptions: [{ value: 'en', label: 'English' }],
    autoFallbackEnabled: false
  };
}
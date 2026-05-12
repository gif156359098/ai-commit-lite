import assert from 'node:assert/strict';
import test from 'node:test';
import { buildProfileManagerPanelBodyMarkup } from '../../src/commands/profileManagerPanelMarkup';
import { buildProfileManagerPanelStyles } from '../../src/commands/profileManagerPanelStyles';
import { escapeHtml } from '../../src/commands/profileManagerPanelHtml';
import { WebviewI18n } from '../../src/commands/profileManagerPanelTypes';

const i18n: WebviewI18n = {
  title: 'Profile <Manager>',
  subtitle: 'Subtitle',
  profileCount: '1 profile',
  addProfileAction: 'Add profile',
  currentProfile: 'Current profile',
  useThisProfile: 'Use this profile',
  editAction: 'Edit',
  deleteAction: 'Delete',
  testAction: 'Test connection',
  testConnectionSuccess: 'Connection successful',
  testConnectionFailed: 'Connection failed',
  provider: 'Provider',
  model: 'Model',
  deploymentName: 'Deployment',
  apiEndpoint: 'API endpoint',
  apiKey: 'API key',
  profileDisplayName: 'Display name',
  profileDisplayNameHint: 'Shown in the list',
  modelNameHint: 'Use a model id',
  deploymentNameHint: 'Use a deployment id',
  apiEndpointHintRequired: 'Endpoint required',
  apiEndpointHintOptional: 'Endpoint optional',
  apiKeyHintNew: 'Stored securely',
  apiKeyHintExisting: 'Leave blank to keep',
  apiKeyStoredNotice: 'Stored securely',
  apiKeyRequiredNotice: 'API key required',
  cancelAction: 'Cancel',
  saveAction: 'Save',
  addProfileTitle: 'Add profile',
  editProfileTitle: 'Edit profile',
  editProfilePrompt: 'Edit prompt',
  deleteProfilePrompt: 'Delete prompt',
  profileDeleteConfirm: 'Delete {label}?',
  profileNameRequired: 'Name required',
  profileModelRequired: 'Model required',
  profileBaseUrlRequired: 'Endpoint required',
  apiKeyRequired: 'API key required',
  noActiveProfileLabel: 'No active profile',
  profilesConfiguredLabel: 'Configured',
  activeProfileLabel: 'Active',
  profileManagerEmptyTitle: 'No profiles yet',
  profileManagerEmptyDescription: 'Create one',
  profileManagerReadyTitle: 'Ready',
  profileManagerReadyDescription: 'Ready description',
  providerSelectionHint: 'Choose a provider',
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
  autoFallbackDisabledNotice: 'Automatic fallback is off.',
  fallbackPanelTitle: 'Fallback profiles',
  fallbackChipActive: 'Active fallback',
  addToPriorityAction: 'Add to fallback',
  removeFromPriorityAction: 'Remove from fallback',
  fallbackActiveLabel: 'Fallback active',
  fallbackAvailableLabel: 'Fallback available'
};

test('buildProfileManagerPanelBodyMarkup keeps required panel hooks', () => {
  const markup = buildProfileManagerPanelBodyMarkup(
    i18n,
    3,
    'Main profile',
    'en',
    [{ value: 'en', label: 'English' }],
    false,
    escapeHtml
  );

  assert.match(markup, /id="profilesContainer"/);
  assert.match(markup, /id="providerPicker"/);
  assert.match(markup, /id="formModal"/);
  assert.match(markup, /id="emptyStateAddButton"/);
  assert.match(markup, /aria-labelledby="formTitle"/);
  assert.match(markup, /Automatic fallback is off\./);
});

test('buildProfileManagerPanelBodyMarkup escapes user-visible content', () => {
  const markup = buildProfileManagerPanelBodyMarkup(
    i18n,
    1,
    '</script><b>active</b>',
    'en',
    [{ value: 'en', label: 'English' }],
    true,
    escapeHtml
  );

  assert.match(markup, /Profile &lt;Manager&gt;/);
  assert.match(markup, /&lt;\/script&gt;&lt;b&gt;active&lt;\/b&gt;/);
  assert.doesNotMatch(markup, /<h1 class="title">Profile <Manager><\/h1>/);
});

test('buildProfileManagerPanelStyles exposes fallback and status-note rules', () => {
  const styles = buildProfileManagerPanelStyles();

  assert.match(styles, /\.overlay\s*\{/);
  assert.match(styles, /\.providers\s*\{/);
  assert.match(styles, /\.fallback-panel\s*\{/);
  assert.match(styles, /\.status-note\s*\{/);
});
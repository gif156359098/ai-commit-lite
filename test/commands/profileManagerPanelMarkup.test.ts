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
  cancelAction: 'Cancel',
  saveAction: 'Save',
  addProfileTitle: 'Add profile',
  editProfileTitle: 'Edit profile',
  editProfilePrompt: 'Edit prompt',
  deleteProfilePrompt: 'Delete prompt',
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
  secretMissingStatus: 'Missing'
};

test('buildProfileManagerPanelBodyMarkup keeps required panel hooks', () => {
  const markup = buildProfileManagerPanelBodyMarkup(i18n, 3, 'Main profile', escapeHtml);

  assert.match(markup, /id="profilesContainer"/);
  assert.match(markup, /id="providerPicker"/);
  assert.match(markup, /id="formModal"/);
  assert.match(markup, /id="emptyStateAddButton"/);
  assert.match(markup, /aria-labelledby="formTitle"/);
});

test('buildProfileManagerPanelBodyMarkup escapes user-visible content', () => {
  const markup = buildProfileManagerPanelBodyMarkup(i18n, 1, '</script><b>active</b>', escapeHtml);

  assert.match(markup, /Profile &lt;Manager&gt;/);
  assert.match(markup, /&lt;\/script&gt;&lt;b&gt;active&lt;\/b&gt;/);
  assert.doesNotMatch(markup, /<h1 class="title">Profile <Manager><\/h1>/);
});

test('buildProfileManagerPanelStyles exposes modal and provider layout rules', () => {
  const styles = buildProfileManagerPanelStyles();

  assert.match(styles, /\.overlay\{display:none;/);
  assert.match(styles, /\.modal-grid\{display:grid;/);
  assert.match(styles, /\.providers\{display:flex;flex-direction:column;/);
});

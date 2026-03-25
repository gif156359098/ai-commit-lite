import { ProviderDefinition } from '../ai/providerRegistry';
import { t } from '../i18n';
import { getProviderEndpointHintKey } from './profileManagerPanelProviderHints';
import { PanelProviderView, WebviewI18n } from './profileManagerPanelTypes';

export function buildI18n(profileCount: number): WebviewI18n {
  return {
    title: t('profileManagerTitle'),
    subtitle: t('profileManagerSubtitle'),
    profileCount: t('profileCount', { count: profileCount }),
    addProfileAction: t('addProfileAction'),
    currentProfile: t('currentProfile'),
    useThisProfile: t('useThisProfile'),
    editAction: t('editAction'),
    deleteAction: t('deleteAction'),
    provider: t('provider'),
    model: t('model'),
    deploymentName: t('deploymentName'),
    apiEndpoint: t('apiEndpoint'),
    apiKey: t('apiKey'),
    profileDisplayName: t('profileDisplayName'),
    profileDisplayNameHint: t('profileDisplayNameHint'),
    modelNameHint: t('modelNameHint'),
    deploymentNameHint: t('deploymentNameHint'),
    apiEndpointHintRequired: t('apiEndpointHintRequired'),
    apiEndpointHintOptional: t('apiEndpointHintOptional'),
    apiKeyHintNew: t('apiKeyHintNew'),
    apiKeyHintExisting: t('apiKeyHintExisting'),
    cancelAction: t('cancelAction'),
    saveAction: t('saveAction'),
    addProfileTitle: t('addProfileTitle'),
    editProfileTitle: t('editProfileTitle'),
    editProfilePrompt: t('editProfilePrompt'),
    deleteProfilePrompt: t('deleteProfilePrompt'),
    profileNameRequired: t('profileNameRequired'),
    profileModelRequired: t('profileModelRequired'),
    profileBaseUrlRequired: t('profileBaseUrlRequired'),
    apiKeyRequired: t('apiKeyRequired'),
    noActiveProfileLabel: t('noActiveProfileLabel'),
    profilesConfiguredLabel: t('profilesConfiguredLabel'),
    activeProfileLabel: t('activeProfileLabel'),
    profileManagerEmptyTitle: t('profileManagerEmptyTitle'),
    profileManagerEmptyDescription: t('profileManagerEmptyDescription'),
    profileManagerReadyTitle: t('profileManagerReadyTitle'),
    profileManagerReadyDescription: t('profileManagerReadyDescription'),
    providerSelectionHint: t('providerSelectionHint'),
    providerAudienceLabel: t('providerAudienceLabel'),
    providerEndpointRuleLabel: t('providerEndpointRuleLabel'),
    connectionDetailsSectionTitle: t('connectionDetailsSectionTitle'),
    closeAction: t('closeAction'),
    secretStoredStatus: t('secretStoredStatus'),
    secretMissingStatus: t('secretMissingStatus')
  };
}

export function toPanelProviderView(provider: ProviderDefinition): PanelProviderView {
  return {
    type: provider.type,
    label: provider.label,
    description: t(provider.descriptionKey),
    audienceHint: t(provider.audienceHintKey),
    endpointHint: t(getProviderEndpointHintKey(provider.endpointHintMode)),
    defaultModel: provider.defaultModel,
    modelPlaceholder: provider.modelPlaceholder,
    modelInputKind: provider.modelInputKind,
    baseUrlMode: provider.baseUrlMode,
    defaultBaseUrl: provider.defaultBaseUrl || '',
    baseUrlPlaceholder: provider.baseUrlPlaceholder || provider.defaultBaseUrl || ''
  };
}

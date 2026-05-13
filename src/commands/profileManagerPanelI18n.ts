import { ProviderDefinition } from '../ai/providerRegistry';
import { t } from '../i18n';
import { getProviderEndpointHintKey } from './profileManagerPanelProviderHints';
import { LanguageOption, PanelProviderView, WebviewI18n } from './profileManagerPanelTypes';

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
    testAction: t('testAction'),
    testConnectionSuccess: t('testConnectionSuccess'),
    testConnectionFailed: t('testConnectionFailed'),
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
    apiKeyStoredNotice: t('apiKeyStoredNotice'),
    apiKeyRequiredNotice: t('apiKeyRequiredNotice'),
    cancelAction: t('cancelAction'),
    saveAction: t('saveAction'),
    addProfileTitle: t('addProfileTitle'),
    editProfileTitle: t('editProfileTitle'),
    editProfilePrompt: t('editProfilePrompt'),
    deleteProfilePrompt: t('deleteProfilePrompt'),
    profileDeleteConfirm: t('profileDeleteConfirm', { label: '{label}' }),
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
    copyAction: t('copyAction'),
    connectionDetailsSectionTitle: t('connectionDetailsSectionTitle'),
    closeAction: t('closeAction'),
    secretStoredStatus: t('secretStoredStatus'),
    secretMissingStatus: t('secretMissingStatus'),
    openSettingsAction: t('openSettingsAction'),
    languageSetting: t('languageSetting'),
    fallbackOrderLabel: t('fallbackOrderLabel'),
    fallbackPriorityValue: t('fallbackPriorityValue'),
    defaultFallbackOrder: t('defaultFallbackOrder'),
    skippedWhileActive: t('skippedWhileActive'),
    prioritizeFallbackAction: t('prioritizeFallbackAction'),
    moveFallbackEarlierAction: t('moveFallbackEarlierAction'),
    moveFallbackLaterAction: t('moveFallbackLaterAction'),
    useDefaultFallbackOrderAction: t('useDefaultFallbackOrderAction'),
    autoFallbackDisabledNotice: t('autoFallbackDisabledNotice'),
  fallbackPanelTitle: t('fallbackPanelTitle'),
  fallbackChipActive: t('fallbackChipActive'),
  addToPriorityAction: t('addToPriorityAction'),
  removeFromPriorityAction: t('removeFromPriorityAction'),
  fallbackActiveLabel: t('fallbackActiveLabel'),
  fallbackAvailableLabel: t('fallbackAvailableLabel')
};
}

export const LANGUAGE_OPTIONS: LanguageOption[] = [
  { value: 'en', label: 'English' },
  { value: 'zh-cn', label: '简体中文' },
  { value: 'ja', label: '日本語' },
  { value: 'ko', label: '한국어' },
  { value: 'es', label: 'Español' },
  { value: 'fr', label: 'Français' },
  { value: 'de', label: 'Deutsch' },
  { value: 'ru', label: 'Русский' },
  { value: 'pt', label: 'Português' },
  { value: 'it', label: 'Italiano' }
];

export function toPanelProviderView(provider: ProviderDefinition): PanelProviderView {
  return {
    type: provider.type,
    label: provider.label,
    description: t(provider.descriptionKey),
    audienceHint: t(provider.audienceHintKey),
    endpointHint: t(getProviderEndpointHintKey(provider.endpointHintMode)),
    defaultModel: provider.defaultModel,
    modelPlaceholder: provider.modelPlaceholderKey
      ? t(provider.modelPlaceholderKey)
      : provider.modelPlaceholder,
    modelInputKind: provider.modelInputKind,
    baseUrlMode: provider.baseUrlMode,
    defaultBaseUrl: provider.defaultBaseUrl || '',
    baseUrlPlaceholder: provider.baseUrlPlaceholderKey
      ? t(provider.baseUrlPlaceholderKey)
      : (provider.baseUrlPlaceholder || provider.defaultBaseUrl || '')
  };
}

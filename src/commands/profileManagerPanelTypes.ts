import { ModelProfile } from '../types/profile';

export type ProfileManagerPanelAction = 'default' | 'add' | 'edit' | 'delete';

export interface ProfileFormData {
  id?: string;
  label: string;
  provider: string;
  model: string;
  baseUrl?: string;
  apiKey?: string;
}

export interface PanelProfileView extends ModelProfile {
  hasApiKey: boolean;
  providerLabel: string;
  providerDescription: string;
  providerAudienceHint: string;
  endpointHint: string;
  fallbackPriority: number | null;
  hasExplicitFallbackPriority: boolean;
  isSkippedWhileActive: boolean;
}

export interface PanelProviderView {
  type: string;
  label: string;
  description: string;
  audienceHint: string;
  endpointHint: string;
  defaultModel: string;
  modelPlaceholder: string;
  modelInputKind: string;
  baseUrlMode: string;
  defaultBaseUrl: string;
  baseUrlPlaceholder: string;
}

export interface WebviewI18n {
  title: string;
  subtitle: string;
  profileCount: string;
  addProfileAction: string;
  currentProfile: string;
  useThisProfile: string;
  editAction: string;
  deleteAction: string;
  testAction: string;
  testConnectionSuccess: string;
  testConnectionFailed: string;
  provider: string;
  model: string;
  deploymentName: string;
  apiEndpoint: string;
  apiKey: string;
  profileDisplayName: string;
  profileDisplayNameHint: string;
  modelNameHint: string;
  deploymentNameHint: string;
  apiEndpointHintRequired: string;
  apiEndpointHintOptional: string;
  apiKeyHintNew: string;
  apiKeyHintExisting: string;
  apiKeyStoredNotice: string;
  apiKeyRequiredNotice: string;
  cancelAction: string;
  saveAction: string;
  addProfileTitle: string;
  editProfileTitle: string;
  editProfilePrompt: string;
  deleteProfilePrompt: string;
  profileDeleteConfirm: string;
  profileNameRequired: string;
  profileModelRequired: string;
  profileBaseUrlRequired: string;
  apiKeyRequired: string;
  noActiveProfileLabel: string;
  profilesConfiguredLabel: string;
  activeProfileLabel: string;
  profileManagerEmptyTitle: string;
  profileManagerEmptyDescription: string;
  profileManagerReadyTitle: string;
  profileManagerReadyDescription: string;
  providerSelectionHint: string;
  providerAudienceLabel: string;
  providerEndpointRuleLabel: string;
  connectionDetailsSectionTitle: string;
  closeAction: string;
  secretStoredStatus: string;
  secretMissingStatus: string;
  openSettingsAction: string;
  languageSetting: string;
  fallbackOrderLabel: string;
  fallbackPriorityValue: string;
  defaultFallbackOrder: string;
  skippedWhileActive: string;
  prioritizeFallbackAction: string;
  useDefaultFallbackOrderAction: string;
  autoFallbackDisabledNotice: string;
  fallbackPanelTitle: string;
  fallbackChipActive: string;
  addToPriorityAction: string;
  removeFromPriorityAction: string;
  fallbackActiveLabel: string;
  fallbackAvailableLabel: string;
}

export interface LanguageOption {
  value: string;
  label: string;
}

export interface BuildWebviewHtmlData {
  cspSource: string;
  locale: string;
  activeProfileLabel: string;
  activeProfileId: string;
  initialAction: ProfileManagerPanelAction;
  i18n: WebviewI18n;
  providers: PanelProviderView[];
  profiles: PanelProfileView[];
  currentLanguage: string;
  languageOptions: LanguageOption[];
  autoFallbackEnabled: boolean;
}

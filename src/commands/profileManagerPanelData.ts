import { sanitizeProfileFallbackOrder } from '../config/profileManagerHelpers';
import { ModelProfile } from '../types/profile';
import {
  BuildWebviewHtmlData,
  LanguageOption,
  PanelProfileView,
  PanelProviderView,
  ProfileManagerPanelAction,
  WebviewI18n
} from './profileManagerPanelTypes';

export interface BuildProfileManagerPanelWebviewDataArgs {
  cspSource: string;
  locale: string;
  activeProfile: ModelProfile | null;
  initialAction: ProfileManagerPanelAction;
  i18n: WebviewI18n;
  providers: PanelProviderView[];
  profiles: ModelProfile[];
  hasProfileApiKey: (profileId: string) => Promise<boolean>;
  currentLanguage: string;
  languageOptions: LanguageOption[];
  autoFallbackEnabled: boolean;
  profileFallbackOrder: string[];
}

export async function buildProfileManagerPanelWebviewData(
  args: BuildProfileManagerPanelWebviewDataArgs
): Promise<BuildWebviewHtmlData> {
  const explicitFallbackOrder = sanitizeProfileFallbackOrder(args.profiles, args.profileFallbackOrder);
  const panelProfiles = await buildPanelProfileViews(
    args.profiles,
    args.providers,
    args.hasProfileApiKey,
    args.activeProfile?.id || '',
    explicitFallbackOrder
  );

  return {
    cspSource: args.cspSource,
    locale: args.locale,
    activeProfileLabel: args.activeProfile?.label || args.i18n.noActiveProfileLabel,
    activeProfileId: args.activeProfile?.id || '',
    initialAction: args.initialAction,
    i18n: args.i18n,
    providers: args.providers,
    profiles: panelProfiles,
    currentLanguage: args.currentLanguage,
    languageOptions: args.languageOptions,
    autoFallbackEnabled: args.autoFallbackEnabled
  };
}

export async function buildPanelProfileViews(
  profiles: ModelProfile[],
  providers: PanelProviderView[],
  hasProfileApiKey: (profileId: string) => Promise<boolean>,
  activeProfileId: string,
  explicitFallbackOrder: string[]
): Promise<PanelProfileView[]> {
  const providerMap = new Map(providers.map((provider) => [provider.type, provider]));

  return await Promise.all(
    profiles.map(async (profile) => {
      const provider = providerMap.get(profile.provider);
      if (!provider) {
        throw new Error(`Panel provider view not found for ${profile.provider}`);
      }

      return buildPanelProfileView(
        profile,
        provider,
        await hasProfileApiKey(profile.id),
        activeProfileId,
        explicitFallbackOrder
      );
    })
  );
}

export function buildPanelProfileView(
  profile: ModelProfile,
  provider: PanelProviderView,
  hasApiKey: boolean,
  activeProfileId: string,
  explicitFallbackOrder: string[]
): PanelProfileView {
  const explicitFallbackIndex = explicitFallbackOrder.indexOf(profile.id);

  return {
    ...profile,
    hasApiKey,
    providerLabel: provider.label,
    providerDescription: provider.description,
    providerAudienceHint: provider.audienceHint,
    endpointHint: provider.endpointHint,
    fallbackPriority: explicitFallbackIndex === -1 ? null : explicitFallbackIndex + 1,
    hasExplicitFallbackPriority: explicitFallbackIndex !== -1,
    isSkippedWhileActive: profile.id === activeProfileId
  };
}
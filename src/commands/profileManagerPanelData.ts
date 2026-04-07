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
}

export async function buildProfileManagerPanelWebviewData(
  args: BuildProfileManagerPanelWebviewDataArgs
): Promise<BuildWebviewHtmlData> {
  const panelProfiles = await buildPanelProfileViews(
    args.profiles,
    args.providers,
    args.hasProfileApiKey
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
    languageOptions: args.languageOptions
  };
}

export async function buildPanelProfileViews(
  profiles: ModelProfile[],
  providers: PanelProviderView[],
  hasProfileApiKey: (profileId: string) => Promise<boolean>
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
        await hasProfileApiKey(profile.id)
      );
    })
  );
}

export function buildPanelProfileView(
  profile: ModelProfile,
  provider: PanelProviderView,
  hasApiKey: boolean
): PanelProfileView {
  return {
    ...profile,
    hasApiKey,
    providerLabel: provider.label,
    providerDescription: provider.description,
    providerAudienceHint: provider.audienceHint,
    endpointHint: provider.endpointHint
  };
}

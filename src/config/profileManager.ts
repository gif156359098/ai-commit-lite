import * as vscode from 'vscode';
import { getProviderDefinition } from '../ai/providerRegistry';
import { resolveProfileConfig } from './profileConfigResolver';
import { getConfig } from './settings';
import { ModelProfile, ProfileConfig, AICommitConfigWithProfile } from '../types/profile';
import {
  buildFallbackOrder,
  filterProfileIdsByCooldown,
  normalizeProfile,
  resolveActiveProfile,
  resolveNextActiveProfileId
} from './profileManagerHelpers';
import {
  readAICommitConfigValue,
  updateAICommitConfigValue
} from './workspaceConfig';
import { t } from '../i18n';

const SECRETS_NAMESPACE = 'ai-commit-lite.apiKey';

const PROFILE_FAILURE_COUNT_KEY = 'aiCommitLite.profileFailureCount';
const PROFILE_LAST_FAILURE_TIME_KEY = 'aiCommitLite.profileLastFailureTime';

let extensionContext: vscode.ExtensionContext | undefined;

export function initProfileManager(context: vscode.ExtensionContext): void {
  extensionContext = context;
}

function getSecrets(): vscode.SecretStorage {
  if (!extensionContext) {
    throw new Error('Profile manager not initialized. Call initProfileManager first.');
  }
  return extensionContext.secrets;
}

function getGlobalState(): vscode.Memento {
  if (!extensionContext) {
    throw new Error('Profile manager not initialized. Call initProfileManager first.');
  }
  return extensionContext.globalState;
}

export function getProfiles(): ModelProfile[] {
  const profiles = readAICommitConfigValue<ModelProfile[]>('profiles', []);
  return profiles
    .map((profile) => normalizeProfile(profile))
    .filter((profile): profile is ModelProfile => profile !== null);
}

export function getProfileConfig(): ProfileConfig {
  return resolveProfileConfig(getProfiles(), readAICommitConfigValue);
}

export function getActiveProfile(): ModelProfile | null {
  const { profiles, activeProfile } = getProfileConfig();
  return resolveActiveProfile(profiles, activeProfile);
}

export async function switchProfile(profileId: string): Promise<void> {
  const profiles = getProfiles();
  const profile = profiles.find(p => p.id === profileId);
  if (!profile) {
    throw new Error(t('invalidProfile', { error: `Profile with ID ${profileId} not found` }));
  }

  await updateAICommitConfigValue('activeProfile', profileId);
}

export async function getEffectiveConfig(): Promise<AICommitConfigWithProfile> {
  const profile = getActiveProfile();
  if (!profile) {
    throw new Error(t('noProfilesConfigured'));
  }

  const apiKey = await getProfileApiKey(profile.id);
  if (!apiKey) {
    throw new Error(t('apiKeyRequiredForProfile', { profile: profile.label }));
  }

  const providerDefinition = getProviderDefinition(profile.provider);
  if (providerDefinition.baseUrlMode === 'required' && !profile.baseUrl) {
    if (profile.provider === 'azure') {
      throw new Error(t('apiEndpointRequiredForAzure'));
    }

    throw new Error(t('profileBaseUrlRequired'));
  }

  const baseConfig = getConfig();

  return {
    ...baseConfig,
    profile,
    apiKey,
    apiEndpoint: profile.baseUrl || providerDefinition.defaultBaseUrl || ''
  };
}

export async function handleQuotaExceeded(currentProfileId: string): Promise<ModelProfile | null> {
  const { profiles, enableAutoFallback, profileFallbackOrder } = getProfileConfig();
  if (!enableAutoFallback) {
    return null;
  }

  await recordProfileFailure(currentProfileId);

  const orderedIds = buildFallbackOrder(profiles, currentProfileId, profileFallbackOrder);

  const viableProfiles = await filterOutRecentlyFailedProfiles(orderedIds);

  for (const profileId of viableProfiles) {
    const profile = profiles.find(p => p.id === profileId);
    if (profile) {
      const apiKey = await getProfileApiKey(profile.id);
      if (apiKey) {
        await switchProfile(profile.id);
        return profile;
      }
    }
  }

  return null;
}

export async function addProfile(profile: ModelProfile): Promise<void> {
  const normalizedProfile = normalizeProfileOrThrow(profile);
  const { profiles, activeProfile } = getProfileConfig();
  if (profiles.some(p => p.id === normalizedProfile.id)) {
    throw new Error(t('invalidProfile', { error: `Profile with ID ${normalizedProfile.id} already exists` }));
  }

  const updatedProfiles = [...profiles, normalizedProfile];
  await updateAICommitConfigValue('profiles', updatedProfiles);

  if (!activeProfile || !profiles.some((item) => item.id === activeProfile)) {
    await updateAICommitConfigValue('activeProfile', normalizedProfile.id);
  }
}

export async function updateProfile(profile: ModelProfile): Promise<void> {
  const normalizedProfile = normalizeProfileOrThrow(profile);
  const { profiles } = getProfileConfig();
  const profileIndex = profiles.findIndex((item) => item.id === normalizedProfile.id);

  if (profileIndex === -1) {
    throw new Error(t('invalidProfile', { error: `Profile with ID ${normalizedProfile.id} not found` }));
  }

  const updatedProfiles = [...profiles];
  updatedProfiles[profileIndex] = normalizedProfile;

  await updateAICommitConfigValue('profiles', updatedProfiles);
}

export async function deleteProfile(profileId: string): Promise<void> {
  const { profiles, activeProfile } = getProfileConfig();
  const updatedProfiles = profiles.filter(p => p.id !== profileId);

  await updateAICommitConfigValue('profiles', updatedProfiles);

  const nextActiveProfileId = resolveNextActiveProfileId(updatedProfiles, profileId, activeProfile);
  if (nextActiveProfileId !== activeProfile) {
    await updateAICommitConfigValue('activeProfile', nextActiveProfileId);
  }

  const secrets = getSecrets();
  await secrets.delete(`${SECRETS_NAMESPACE}.${profileId}`);
}

export async function storeProfileApiKey(profileId: string, apiKey: string): Promise<void> {
  const secrets = getSecrets();
  await secrets.store(`${SECRETS_NAMESPACE}.${profileId}`, apiKey);
}

export async function getProfileApiKey(profileId: string): Promise<string | undefined> {
  const secrets = getSecrets();
  return await secrets.get(`${SECRETS_NAMESPACE}.${profileId}`);
}

export async function hasProfileApiKey(profileId: string): Promise<boolean> {
  return Boolean(await getProfileApiKey(profileId));
}

async function recordProfileFailure(profileId: string): Promise<void> {
  const globalState = getGlobalState();
  const failures = globalState.get<Record<string, number>>(PROFILE_FAILURE_COUNT_KEY, {});
  failures[profileId] = (failures[profileId] || 0) + 1;
  await globalState.update(PROFILE_FAILURE_COUNT_KEY, failures);

  const lastFailureTimes = globalState.get<Record<string, number>>(PROFILE_LAST_FAILURE_TIME_KEY, {});
  lastFailureTimes[profileId] = Date.now();
  await globalState.update(PROFILE_LAST_FAILURE_TIME_KEY, lastFailureTimes);
}

async function filterOutRecentlyFailedProfiles(profileIds: string[]): Promise<string[]> {
  const globalState = getGlobalState();
  const lastFailureTimes = globalState.get<Record<string, number>>(PROFILE_LAST_FAILURE_TIME_KEY, {});
  return filterProfileIdsByCooldown(profileIds, lastFailureTimes);
}

function normalizeProfileOrThrow(profile: ModelProfile): ModelProfile {
  const normalizedProfile = normalizeProfile(profile);

  if (!normalizedProfile) {
    throw new Error(t('invalidProfile', { error: t('providerNotSupported') }));
  }

  return normalizedProfile;
}


import * as vscode from 'vscode';
import { getProviderDefinition } from '../ai/providerRegistry';
import { resolveProfileConfig } from './profileConfigResolver';
import { getConfig } from './settings';
import { ModelProfile, ProfileConfig, AICommitConfigWithProfile } from '../types/profile';
import {
  buildFallbackOrder,
  clearProfileFromFallbackOrder,
  ensureProfileFirstInFallbackOrder,
  FallbackMoveDirection,
  filterProfileIdsByCooldown,
  moveProfileInFallbackOrder,
  normalizeProfile,
  prioritizeProfileInFallbackOrder,
  reorderFallbackProfiles as reorderFallbackProfilesHelper,
  resolveActiveProfile,
  resolveNextActiveProfileId,
  sanitizeProfileFallbackOrder
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
  const profile = profiles.find((item) => item.id === profileId);
  if (!profile) {
    throw new Error(t('invalidProfile', { error: `Profile with ID ${profileId} not found` }));
  }

  await updateAICommitConfigValue('activeProfile', profileId);

  const { profileFallbackOrder } = resolveProfileConfig(profiles, readAICommitConfigValue);
  const updatedOrder = ensureProfileFirstInFallbackOrder(profiles, profileFallbackOrder, profileId);
  await updateProfileFallbackOrder(profiles, updatedOrder);
}

export async function getEffectiveConfig(): Promise<AICommitConfigWithProfile> {
  const profile = getActiveProfile();
  if (!profile) {
    throw new Error(t('noProfilesConfigured'));
  }

  return await getEffectiveConfigForProfile(profile.id);
}

export async function getEffectiveConfigForProfile(profileId: string): Promise<AICommitConfigWithProfile> {
  const profile = getProfiles().find((item) => item.id === profileId);
  if (!profile) {
    throw new Error(t('invalidProfile', { error: `Profile with ID ${profileId} not found` }));
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

export async function handleProfileFailure(currentProfileId: string): Promise<ModelProfile | null> {
  const { profiles, enableAutoFallback, profileFallbackOrder } = getProfileConfig();
  if (!enableAutoFallback) {
    return null;
  }

  await recordProfileFailure(currentProfileId);

  const orderedIds = buildFallbackOrder(profiles, currentProfileId, profileFallbackOrder);

  const viableProfiles = await filterOutRecentlyFailedProfiles(orderedIds);

  for (const profileId of viableProfiles) {
    const profile = profiles.find((item) => item.id === profileId);
    if (profile) {
      const apiKey = await getProfileApiKey(profile.id);
      if (apiKey) {
        return profile;
      }
    }
  }

  return null;
}

export async function prioritizeFallbackProfile(profileId: string): Promise<void> {
  const profiles = getProfiles();
  assertProfileExists(profileId, profiles);
  const { profileFallbackOrder } = resolveProfileConfig(profiles, readAICommitConfigValue);

  await updateProfileFallbackOrder(
    profiles,
    prioritizeProfileInFallbackOrder(profiles, profileFallbackOrder, profileId)
  );
}

export async function moveFallbackProfile(
  profileId: string,
  direction: FallbackMoveDirection
): Promise<void> {
  const profiles = getProfiles();
  assertProfileExists(profileId, profiles);
  const { profileFallbackOrder } = resolveProfileConfig(profiles, readAICommitConfigValue);

  await updateProfileFallbackOrder(
    profiles,
    moveProfileInFallbackOrder(profiles, profileFallbackOrder, profileId, direction)
  );
}

export async function clearFallbackPriority(profileId: string): Promise<void> {
  const profiles = getProfiles();
  assertProfileExists(profileId, profiles);
  const { profileFallbackOrder, activeProfile } = resolveProfileConfig(profiles, readAICommitConfigValue);

  if (activeProfile && profileId === activeProfile) {
    return;
  }

  await updateProfileFallbackOrder(
    profiles,
    clearProfileFromFallbackOrder(profiles, profileFallbackOrder, profileId)
  );
}

export async function reorderFallbackProfiles(newOrder: string[]): Promise<void> {
  const profiles = getProfiles();
  const { profileFallbackOrder, activeProfile } = resolveProfileConfig(profiles, readAICommitConfigValue);

  let updatedOrder = reorderFallbackProfilesHelper(profiles, profileFallbackOrder, newOrder);

  if (activeProfile) {
    updatedOrder = ensureProfileFirstInFallbackOrder(profiles, updatedOrder, activeProfile);
  }

  await updateProfileFallbackOrder(profiles, updatedOrder);
}

export async function addProfile(profile: ModelProfile): Promise<void> {
  const normalizedProfile = normalizeProfileOrThrow(profile);
  const { profiles, activeProfile } = getProfileConfig();
  if (profiles.some((item) => item.id === normalizedProfile.id)) {
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
  const { profiles, activeProfile, profileFallbackOrder } = getProfileConfig();
  const updatedProfiles = profiles.filter((profile) => profile.id !== profileId);

  await updateAICommitConfigValue('profiles', updatedProfiles);
  await updateProfileFallbackOrder(
    updatedProfiles,
    clearProfileFromFallbackOrder(updatedProfiles, profileFallbackOrder, profileId)
  );

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

async function updateProfileFallbackOrder(
  profiles: ModelProfile[],
  profileFallbackOrder: string[]
): Promise<void> {
  await updateAICommitConfigValue(
    'profileFallbackOrder',
    sanitizeProfileFallbackOrder(profiles, profileFallbackOrder)
  );
}

function assertProfileExists(profileId: string, profiles: ModelProfile[]): void {
  if (!profiles.some((profile) => profile.id === profileId)) {
    throw new Error(t('invalidProfile', { error: `Profile with ID ${profileId} not found` }));
  }
}

function normalizeProfileOrThrow(profile: ModelProfile): ModelProfile {
  const normalizedProfile = normalizeProfile(profile);

  if (!normalizedProfile) {
    throw new Error(t('invalidProfile', { error: t('providerNotSupported') }));
  }

  return normalizedProfile;
}

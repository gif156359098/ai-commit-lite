import { getProviderDefinition, isProviderType, normalizeProviderType } from '../ai/providerRegistry';
import { ModelProfile } from '../types/profile';

const DEFAULT_FAILURE_COOLDOWN_MS = 60 * 60 * 1000;

export function normalizeProfile(profile: ModelProfile): ModelProfile | null {
  if (!profile || !profile.id || !profile.label || !profile.provider || !profile.model) {
    return null;
  }

  if (!isProviderType(profile.provider)) {
    return null;
  }

  const provider = normalizeProviderType(profile.provider);
  const providerDefinition = getProviderDefinition(provider);
  const id = profile.id.trim();
  const label = profile.label.trim();
  const model = profile.model.trim();
  const baseUrl = typeof profile.baseUrl === 'string'
    ? profile.baseUrl.trim().replace(/\/+$/g, '')
    : '';

  if (!id || !label || !model) {
    return null;
  }

  return {
    id,
    label,
    provider,
    model,
    baseUrl: providerDefinition.baseUrlMode === 'hidden'
      ? undefined
      : (baseUrl || undefined)
  };
}

export function resolveActiveProfile(
  profiles: ModelProfile[],
  activeProfileId: string
): ModelProfile | null {
  if (profiles.length === 0) {
    return null;
  }

  return profiles.find((profile) => profile.id === activeProfileId) || profiles[0];
}

export function buildFallbackOrder(
  profiles: ModelProfile[],
  currentProfileId: string,
  profileFallbackOrder: string[]
): string[] {
  if (profileFallbackOrder.length > 0) {
    return profileFallbackOrder.filter((profileId) => profileId !== currentProfileId);
  }

  return profiles
    .map((profile) => profile.id)
    .filter((profileId) => profileId !== currentProfileId);
}

export function filterProfileIdsByCooldown(
  profileIds: string[],
  lastFailureTimes: Record<string, number>,
  now: number = Date.now(),
  cooldownMs: number = DEFAULT_FAILURE_COOLDOWN_MS
): string[] {
  return profileIds.filter((profileId) => {
    const lastFailure = lastFailureTimes[profileId];

    if (!lastFailure) {
      return true;
    }

    return now - lastFailure > cooldownMs;
  });
}

export function resolveNextActiveProfileId(
  profiles: ModelProfile[],
  deletedProfileId: string,
  activeProfileId: string
): string {
  if (activeProfileId !== deletedProfileId && profiles.some((profile) => profile.id === activeProfileId)) {
    return activeProfileId;
  }

  return profiles[0]?.id || '';
}

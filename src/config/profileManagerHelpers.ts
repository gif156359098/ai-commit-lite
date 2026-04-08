import { getProviderDefinition, isProviderType, normalizeProviderType } from '../ai/providerRegistry';
import { ModelProfile } from '../types/profile';

const DEFAULT_FAILURE_COOLDOWN_MS = 60 * 60 * 1000;

export type FallbackMoveDirection = 'up' | 'down';

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

export function sanitizeProfileFallbackOrder(
  profiles: ModelProfile[],
  profileFallbackOrder: string[]
): string[] {
  const validProfileIds = new Set(profiles.map((profile) => profile.id));
  const seenProfileIds = new Set<string>();

  return profileFallbackOrder.filter((profileId) => {
    if (!validProfileIds.has(profileId) || seenProfileIds.has(profileId)) {
      return false;
    }

    seenProfileIds.add(profileId);
    return true;
  });
}

export function buildFallbackOrder(
  profiles: ModelProfile[],
  currentProfileId: string,
  profileFallbackOrder: string[]
): string[] {
  const explicitFallbackOrder = sanitizeProfileFallbackOrder(profiles, profileFallbackOrder)
    .filter((profileId) => profileId !== currentProfileId);
  const explicitProfileIds = new Set(explicitFallbackOrder);
  const remainingProfileIds = profiles
    .map((profile) => profile.id)
    .filter((profileId) => profileId !== currentProfileId && !explicitProfileIds.has(profileId));

  return [...explicitFallbackOrder, ...remainingProfileIds];
}

export function prioritizeProfileInFallbackOrder(
  profiles: ModelProfile[],
  profileFallbackOrder: string[],
  profileId: string
): string[] {
  const sanitizedOrder = sanitizeProfileFallbackOrder(profiles, profileFallbackOrder);
  const validProfileIds = new Set(profiles.map((profile) => profile.id));

  if (!validProfileIds.has(profileId) || sanitizedOrder.includes(profileId)) {
    return sanitizedOrder;
  }

  return [...sanitizedOrder, profileId];
}

export function moveProfileInFallbackOrder(
  profiles: ModelProfile[],
  profileFallbackOrder: string[],
  profileId: string,
  direction: FallbackMoveDirection
): string[] {
  const sanitizedOrder = sanitizeProfileFallbackOrder(profiles, profileFallbackOrder);
  const currentIndex = sanitizedOrder.indexOf(profileId);

  if (currentIndex === -1) {
    return sanitizedOrder;
  }

  const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
  if (targetIndex < 0 || targetIndex >= sanitizedOrder.length) {
    return sanitizedOrder;
  }

  const nextOrder = [...sanitizedOrder];
  [nextOrder[currentIndex], nextOrder[targetIndex]] = [nextOrder[targetIndex], nextOrder[currentIndex]];
  return nextOrder;
}

export function clearProfileFromFallbackOrder(
  profiles: ModelProfile[],
  profileFallbackOrder: string[],
  profileId: string
): string[] {
  return sanitizeProfileFallbackOrder(
    profiles,
    profileFallbackOrder.filter((candidateProfileId) => candidateProfileId !== profileId)
  );
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
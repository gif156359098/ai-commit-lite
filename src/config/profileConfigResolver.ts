import { ModelProfile, ProfileConfig } from '../types/profile';
import { sanitizeProfileFallbackOrder } from './profileManagerHelpers';
import { WorkspaceConfigReader } from './workspaceConfig';

export function resolveProfileConfig(
  profiles: ModelProfile[],
  readValue: WorkspaceConfigReader
): ProfileConfig {
  return {
    profiles,
    activeProfile: readValue('activeProfile', ''),
    enableAutoFallback: readValue('enableAutoFallback', true),
    profileFallbackOrder: sanitizeProfileFallbackOrder(
      profiles,
      [...readValue('profileFallbackOrder', [] as string[])]
    )
  };
}
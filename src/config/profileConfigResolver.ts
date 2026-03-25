import { ModelProfile, ProfileConfig } from '../types/profile';
import { WorkspaceConfigReader } from './workspaceConfig';

export function resolveProfileConfig(
  profiles: ModelProfile[],
  readValue: WorkspaceConfigReader
): ProfileConfig {
  return {
    profiles,
    activeProfile: readValue('activeProfile', ''),
    enableAutoFallback: readValue('enableAutoFallback', true),
    profileFallbackOrder: [...readValue('profileFallbackOrder', [] as string[])]
  };
}

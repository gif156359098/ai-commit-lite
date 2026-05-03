import { getProviderDefinition, isProviderType } from '../ai/providerRegistry';
import { normalizeProfile } from '../config/profileManagerHelpers';
import { AIProviderType, ModelProfile } from '../types/profile';
import {
  getProfileDeleteSuccessDescriptor,
  getProfileSaveSuccessDescriptor,
  getProfileSwitchSuccessDescriptor,
  LocalizedMessageDescriptor
} from './commandMessageDescriptors';
import { ProfileFormData } from './profileManagerPanelTypes';

export interface ProfileManagerPanelOperationDeps {
  getProfiles: () => ModelProfile[];
  addProfile: (profile: ModelProfile) => Promise<void>;
  updateProfile: (profile: ModelProfile) => Promise<void>;
  deleteProfile: (profileId: string) => Promise<void>;
  switchProfile: (profileId: string) => Promise<void>;
  hasProfileApiKey: (profileId: string) => Promise<boolean>;
  storeProfileApiKey: (profileId: string, apiKey: string) => Promise<void>;
  now: () => number;
}

export class ProfileManagerPanelOperationError extends Error {
  public readonly descriptor: LocalizedMessageDescriptor;

  public constructor(descriptor: LocalizedMessageDescriptor) {
    super(descriptor.key);
    this.descriptor = descriptor;
    this.name = 'ProfileManagerPanelOperationError';
  }
}

export async function saveProfileFromForm(
  data: ProfileFormData,
  deps: ProfileManagerPanelOperationDeps
): Promise<LocalizedMessageDescriptor> {
  const isNew = !data.id;
  const existingProfiles = deps.getProfiles();
  const existingProfile = data.id
    ? existingProfiles.find((profile) => profile.id === data.id)
    : undefined;

  if (!isNew && !existingProfile) {
    throw new ProfileManagerPanelOperationError({
      key: 'invalidProfile',
      params: { error: 'Profile not found' }
    });
  }

  if (!isProviderType(data.provider)) {
    throw new ProfileManagerPanelOperationError({ key: 'providerNotSupported' });
  }

  const provider = data.provider as AIProviderType;
  const providerDefinition = getProviderDefinition(provider);
  const label = data.label.trim();
  const model = data.model.trim();
  const baseUrl = (data.baseUrl || '').trim();
  const apiKey = (data.apiKey || '').trim();
  const hasExistingKey = existingProfile
    ? await deps.hasProfileApiKey(existingProfile.id)
    : false;

  if (!label) {
    throw new ProfileManagerPanelOperationError({ key: 'profileNameRequired' });
  }

  if (!model) {
    throw new ProfileManagerPanelOperationError({ key: 'profileModelRequired' });
  }

  if (providerDefinition.baseUrlMode === 'required' && !baseUrl) {
    throw new ProfileManagerPanelOperationError({
      key: provider === 'azure' ? 'apiEndpointRequiredForAzure' : 'profileBaseUrlRequired'
    });
  }

  if (!apiKey && !hasExistingKey) {
    throw new ProfileManagerPanelOperationError({ key: 'apiKeyRequired' });
  }

  const id = existingProfile?.id || `${providerDefinition.type}-${deps.now()}`;
  const normalizedProfile = normalizeProfile({
    id,
    label,
    provider,
    model,
    baseUrl: providerDefinition.baseUrlMode === 'hidden' ? undefined : (baseUrl || undefined)
  });

  if (!normalizedProfile) {
    throw new ProfileManagerPanelOperationError({
      key: 'invalidProfile',
      params: { error: 'Profile validation failed' }
    });
  }

  if (isNew) {
    await deps.addProfile(normalizedProfile);
  } else {
    await deps.updateProfile(normalizedProfile);
  }

  if (apiKey) {
    await deps.storeProfileApiKey(id, apiKey);
  }

  return getProfileSaveSuccessDescriptor(isNew, label);
}

export async function deleteProfileById(
  profileId: string,
  deps: Pick<ProfileManagerPanelOperationDeps, 'getProfiles' | 'deleteProfile'>
): Promise<LocalizedMessageDescriptor> {
  const profile = deps.getProfiles().find((item) => item.id === profileId);

  if (!profile) {
    throw new ProfileManagerPanelOperationError({
      key: 'invalidProfile',
      params: { error: `Profile with ID ${profileId} not found` }
    });
  }

  await deps.deleteProfile(profileId);
  return getProfileDeleteSuccessDescriptor(profile.label);
}

export async function switchProfileById(
  profileId: string,
  deps: Pick<ProfileManagerPanelOperationDeps, 'getProfiles' | 'switchProfile'>
): Promise<LocalizedMessageDescriptor> {
  const profile = deps.getProfiles().find((item) => item.id === profileId);

  if (!profile) {
    throw new ProfileManagerPanelOperationError({
      key: 'invalidProfile',
      params: { error: `Profile with ID ${profileId} not found` }
    });
  }

  await deps.switchProfile(profileId);
  return getProfileSwitchSuccessDescriptor(profile.label);
}

export function getProfileManagerPanelOperationErrorDescriptor(
  error: unknown,
  fallbackDescriptorFactory: (message: string) => LocalizedMessageDescriptor
): LocalizedMessageDescriptor {
  if (error instanceof ProfileManagerPanelOperationError) {
    return error.descriptor;
  }

  if (error instanceof Error) {
    return fallbackDescriptorFactory(error.message);
  }

  return fallbackDescriptorFactory(String(error));
}

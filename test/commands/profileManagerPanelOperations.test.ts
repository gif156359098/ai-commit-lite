import assert from 'node:assert/strict';
import test from 'node:test';
import { ModelProfile } from '../../src/types/profile';
import {
  deleteProfileById,
  getProfileManagerPanelOperationErrorDescriptor,
  ProfileManagerPanelOperationDeps,
  ProfileManagerPanelOperationError,
  saveProfileFromForm,
  switchProfileById
} from '../../src/commands/profileManagerPanelOperations';

function createDeps(
  profiles: ModelProfile[],
  overrides: Partial<ProfileManagerPanelOperationDeps> = {}
): ProfileManagerPanelOperationDeps & {
  calls: {
    addProfile: ModelProfile[];
    updateProfile: ModelProfile[];
    deleteProfile: string[];
    switchProfile: string[];
    storeProfileApiKey: Array<{ profileId: string; apiKey: string }>;
  };
} {
  const calls = {
    addProfile: [] as ModelProfile[],
    updateProfile: [] as ModelProfile[],
    deleteProfile: [] as string[],
    switchProfile: [] as string[],
    storeProfileApiKey: [] as Array<{ profileId: string; apiKey: string }>
  };

  return {
    getProfiles: () => profiles,
    addProfile: async (profile: ModelProfile) => {
      calls.addProfile.push(profile);
    },
    updateProfile: async (profile: ModelProfile) => {
      calls.updateProfile.push(profile);
    },
    deleteProfile: async (profileId: string) => {
      calls.deleteProfile.push(profileId);
    },
    switchProfile: async (profileId: string) => {
      calls.switchProfile.push(profileId);
    },
    hasProfileApiKey: async () => false,
    storeProfileApiKey: async (profileId: string, apiKey: string) => {
      calls.storeProfileApiKey.push({ profileId, apiKey });
    },
    now: () => 123,
    ...overrides,
    calls
  };
}

test('saveProfileFromForm creates a normalized profile and stores a new api key', async () => {
  const deps = createDeps([]);

  const descriptor = await saveProfileFromForm({
    label: '  Demo Profile  ',
    provider: 'openai',
    model: '  gpt-4.1-mini  ',
    baseUrl: ' https://ignored.example.com/v1/ ',
    apiKey: '  secret-key  '
  }, deps);

  assert.deepEqual(descriptor, {
    key: 'profileAdded',
    params: { label: 'Demo Profile' }
  });
  assert.deepEqual(deps.calls.addProfile, [{
    id: 'openai-123',
    label: 'Demo Profile',
    provider: 'openai',
    model: 'gpt-4.1-mini',
    baseUrl: undefined
  }]);
  assert.deepEqual(deps.calls.storeProfileApiKey, [{
    profileId: 'openai-123',
    apiKey: 'secret-key'
  }]);
});

test('saveProfileFromForm updates an existing profile without overwriting a retained api key', async () => {
  const existingProfiles: ModelProfile[] = [{
    id: 'custom-1',
    label: 'Existing',
    provider: 'openai-compatible',
    model: 'old-model',
    baseUrl: 'https://api.old.example/v1'
  }];
  const deps = createDeps(existingProfiles, {
    hasProfileApiKey: async () => true
  });

  const descriptor = await saveProfileFromForm({
    id: 'custom-1',
    label: '  Updated Label ',
    provider: 'openai-compatible',
    model: ' new-model ',
    baseUrl: ' https://api.example.com/v1/ ',
    apiKey: '   '
  }, deps);

  assert.deepEqual(descriptor, {
    key: 'profileUpdated',
    params: { label: 'Updated Label' }
  });
  assert.deepEqual(deps.calls.updateProfile, [{
    id: 'custom-1',
    label: 'Updated Label',
    provider: 'openai-compatible',
    model: 'new-model',
    baseUrl: 'https://api.example.com/v1'
  }]);
  assert.deepEqual(deps.calls.storeProfileApiKey, []);
});

test('saveProfileFromForm throws a descriptor-backed error when required endpoint is missing', async () => {
  const deps = createDeps([]);

  await assert.rejects(
    () => saveProfileFromForm({
      label: 'Azure',
      provider: 'azure',
      model: 'deployment-name',
      apiKey: 'secret'
    }, deps),
    (error: unknown) => {
      assert.ok(error instanceof ProfileManagerPanelOperationError);
      assert.deepEqual(error.descriptor, { key: 'apiEndpointRequiredForAzure' });
      return true;
    }
  );
});

test('deleteProfileById and switchProfileById return success descriptors and invoke deps', async () => {
  const deps = createDeps([{
    id: 'demo',
    label: 'Demo',
    provider: 'openai',
    model: 'gpt-4.1-mini'
  }]);

  const deleteDescriptor = await deleteProfileById('demo', deps);
  const switchDescriptor = await switchProfileById('demo', deps);

  assert.deepEqual(deleteDescriptor, {
    key: 'profileDeleted',
    params: { label: 'Demo' }
  });
  assert.deepEqual(switchDescriptor, {
    key: 'profileSwitched',
    params: { profile: 'Demo' }
  });
  assert.deepEqual(deps.calls.deleteProfile, ['demo']);
  assert.deepEqual(deps.calls.switchProfile, ['demo']);
});

test('getProfileManagerPanelOperationErrorDescriptor unwraps descriptor-backed errors', () => {
  const descriptor = getProfileManagerPanelOperationErrorDescriptor(
    new ProfileManagerPanelOperationError({ key: 'profileNameRequired' }),
    (message) => ({ key: 'fallback', params: { message } })
  );

  assert.deepEqual(descriptor, { key: 'profileNameRequired' });
  assert.deepEqual(
    getProfileManagerPanelOperationErrorDescriptor(
      new Error('boom'),
      (message) => ({ key: 'fallback', params: { message } })
    ),
    { key: 'fallback', params: { message: 'boom' } }
  );
});

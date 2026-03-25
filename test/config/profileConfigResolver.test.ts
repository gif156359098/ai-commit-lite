import assert from 'node:assert/strict';
import test from 'node:test';
import { resolveProfileConfig } from '../../src/config/profileConfigResolver';
import { ModelProfile } from '../../src/types/profile';

function createProfile(id: string): ModelProfile {
  return {
    id,
    label: `Profile ${id}`,
    provider: 'openai',
    model: 'gpt-4.1-mini'
  };
}

test('resolveProfileConfig uses reader values and preserves profiles', () => {
  const profiles = [createProfile('a'), createProfile('b')];
  const profileConfig = resolveProfileConfig(profiles, (key, defaultValue) => {
    const values: Record<string, unknown> = {
      activeProfile: 'b',
      enableAutoFallback: false,
      profileFallbackOrder: ['b', 'a']
    };

    return (key in values ? values[key] : defaultValue) as typeof defaultValue;
  });

  assert.equal(profileConfig.activeProfile, 'b');
  assert.equal(profileConfig.enableAutoFallback, false);
  assert.deepEqual(profileConfig.profileFallbackOrder, ['b', 'a']);
  assert.deepEqual(profileConfig.profiles, profiles);
});

test('resolveProfileConfig falls back to defaults and clones fallback order array', () => {
  const fallbackOrder = ['x', 'y'];
  const profileConfig = resolveProfileConfig([], (key, defaultValue) => {
    if (key === 'profileFallbackOrder') {
      return fallbackOrder as typeof defaultValue;
    }

    return defaultValue;
  });

  assert.equal(profileConfig.activeProfile, '');
  assert.equal(profileConfig.enableAutoFallback, true);
  assert.deepEqual(profileConfig.profileFallbackOrder, ['x', 'y']);

  profileConfig.profileFallbackOrder.push('z');
  assert.deepEqual(fallbackOrder, ['x', 'y']);
});

import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildFallbackOrder,
  clearProfileFromFallbackOrder,
  filterProfileIdsByCooldown,
  moveProfileInFallbackOrder,
  normalizeProfile,
  prioritizeProfileInFallbackOrder,
  resolveActiveProfile,
  resolveNextActiveProfileId,
  sanitizeProfileFallbackOrder
} from '../../src/config/profileManagerHelpers';
import { ModelProfile } from '../../src/types/profile';

function createProfile(
  id: string,
  overrides: Partial<ModelProfile> = {}
): ModelProfile {
  return {
    id,
    label: `Profile ${id}`,
    provider: 'openai-compatible',
    model: 'gpt-4.1-mini',
    baseUrl: 'https://api.example.com/v1/',
    ...overrides
  };
}

test('normalizeProfile trims fields and normalizes baseUrl trailing slash', () => {
  const normalizedProfile = normalizeProfile(createProfile('  demo  ', {
    label: '  Demo Profile  ',
    model: '  custom-model  ',
    baseUrl: ' https://api.example.com/v1/// '
  }));

  assert.deepEqual(normalizedProfile, {
    id: 'demo',
    label: 'Demo Profile',
    provider: 'openai-compatible',
    model: 'custom-model',
    baseUrl: 'https://api.example.com/v1'
  });
});

test('normalizeProfile hides baseUrl for official providers', () => {
  const normalizedProfile = normalizeProfile(createProfile('openai', {
    provider: 'openai',
    baseUrl: 'https://api.openai.com/v1'
  }));

  assert.equal(normalizedProfile?.baseUrl, undefined);
});

test('resolveActiveProfile returns requested profile or falls back to first', () => {
  const profiles = [createProfile('a'), createProfile('b')];

  assert.equal(resolveActiveProfile(profiles, 'b')?.id, 'b');
  assert.equal(resolveActiveProfile(profiles, 'missing')?.id, 'a');
  assert.equal(resolveActiveProfile([], 'missing'), null);
});

test('sanitizeProfileFallbackOrder removes duplicates and invalid profile ids', () => {
  const profiles = [createProfile('a'), createProfile('b'), createProfile('c')];

  assert.deepEqual(
    sanitizeProfileFallbackOrder(profiles, ['c', 'missing', 'a', 'c', 'b']),
    ['c', 'a', 'b']
  );
});

test('buildFallbackOrder prioritizes explicit order, skips current profile, and appends the remaining profiles', () => {
  const profiles = [createProfile('a'), createProfile('b'), createProfile('c'), createProfile('d')];

  assert.deepEqual(
    buildFallbackOrder(profiles, 'b', ['c', 'b', 'a']),
    ['c', 'a', 'd']
  );
  assert.deepEqual(buildFallbackOrder(profiles, 'b', []), ['a', 'c', 'd']);
});

test('prioritize, move, and clear fallback profiles preserve explicit ordering only', () => {
  const profiles = [createProfile('a'), createProfile('b'), createProfile('c')];

  const prioritized = prioritizeProfileInFallbackOrder(profiles, ['b'], 'c');
  assert.deepEqual(prioritized, ['b', 'c']);

  const movedUp = moveProfileInFallbackOrder(profiles, ['a', 'b', 'c'], 'c', 'up');
  assert.deepEqual(movedUp, ['a', 'c', 'b']);

  const movedDown = moveProfileInFallbackOrder(profiles, ['a', 'b', 'c'], 'a', 'down');
  assert.deepEqual(movedDown, ['b', 'a', 'c']);

  const cleared = clearProfileFromFallbackOrder(profiles, ['a', 'b', 'c'], 'b');
  assert.deepEqual(cleared, ['a', 'c']);
});

test('filterProfileIdsByCooldown excludes recently failed profiles only within cooldown', () => {
  const now = 1_000_000;
  const filtered = filterProfileIdsByCooldown(
    ['a', 'b', 'c'],
    {
      b: now - 1000,
      c: now - (2 * 60 * 60 * 1000)
    },
    now
  );

  assert.deepEqual(filtered, ['a', 'c']);
});

test('resolveNextActiveProfileId preserves valid active profile or falls back to first remaining', () => {
  const profiles = [createProfile('b'), createProfile('c')];

  assert.equal(resolveNextActiveProfileId(profiles, 'a', 'c'), 'c');
  assert.equal(resolveNextActiveProfileId(profiles, 'b', 'b'), 'b');
  assert.equal(resolveNextActiveProfileId([], 'a', 'a'), '');
});
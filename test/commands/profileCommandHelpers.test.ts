import assert from 'node:assert/strict';
import test from 'node:test';
import {
  getEmptyProfilePromptDescriptor,
  getProfileManagerInitialAction,
  resolveProfileManagerPanelAction,
  shouldShowEmptyProfileOnboarding
} from '../../src/commands/profileCommandHelpers';

test('getProfileManagerInitialAction returns add when there are no profiles', () => {
  assert.equal(getProfileManagerInitialAction(0), 'add');
});

test('getProfileManagerInitialAction returns default when at least one profile exists', () => {
  assert.equal(getProfileManagerInitialAction(1), 'default');
  assert.equal(getProfileManagerInitialAction(3), 'default');
});

test('resolveProfileManagerPanelAction only rewrites default to add for empty state', () => {
  assert.equal(resolveProfileManagerPanelAction(0, 'default'), 'add');
  assert.equal(resolveProfileManagerPanelAction(2, 'default'), 'default');
  assert.equal(resolveProfileManagerPanelAction(0, 'edit'), 'edit');
  assert.equal(resolveProfileManagerPanelAction(0, 'delete'), 'delete');
});

test('shouldShowEmptyProfileOnboarding only returns true before the first empty-state prompt', () => {
  assert.equal(shouldShowEmptyProfileOnboarding(0, false), true);
  assert.equal(shouldShowEmptyProfileOnboarding(0, true), false);
  assert.equal(shouldShowEmptyProfileOnboarding(2, false), false);
});

test('getEmptyProfilePromptDescriptor maps onboarding and command variants', () => {
  assert.deepEqual(getEmptyProfilePromptDescriptor('onboarding'), {
    messageKey: 'emptyProfileOnboardingMessage',
    severity: 'info',
    openPanelAction: 'add'
  });
  assert.deepEqual(getEmptyProfilePromptDescriptor('command'), {
    messageKey: 'emptyProfileCommandPrompt',
    severity: 'warning',
    openPanelAction: 'add'
  });
});

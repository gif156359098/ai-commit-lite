import assert from 'node:assert/strict';
import test from 'node:test';
import { PROFILE_MANAGER_PANEL_ICON_PATHS } from '../../src/commands/profileManagerPanelIconPaths';

test('profile manager panel icon paths point to dedicated light and dark assets', () => {
  assert.deepEqual(PROFILE_MANAGER_PANEL_ICON_PATHS.light, [
    'resources',
    'light',
    'profile-manager.svg'
  ]);
  assert.deepEqual(PROFILE_MANAGER_PANEL_ICON_PATHS.dark, [
    'resources',
    'dark',
    'profile-manager.svg'
  ]);
});

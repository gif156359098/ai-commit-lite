import assert from 'node:assert/strict';
import test from 'node:test';
import {
  EXTENSION_COMMAND_ID_LIST,
  EXTENSION_COMMAND_IDS,
  PROFILE_MANAGER_STATUS_BAR_DESCRIPTOR
} from '../../src/activation/extensionManifest';

test('extension command manifest exposes the expected command ids in stable order', () => {
  assert.deepEqual([...EXTENSION_COMMAND_ID_LIST], [
    'ai-commit-lite.generateCommit',
    'ai-commit-lite.switchProfile',
    'ai-commit-lite.openProfileManager',
    'ai-commit-lite.addProfile',
    'ai-commit-lite.editProfile',
    'ai-commit-lite.deleteProfile'
  ]);
});

test('extension command ids are unique and status bar points to profile manager command', () => {
  assert.equal(new Set(EXTENSION_COMMAND_ID_LIST).size, EXTENSION_COMMAND_ID_LIST.length);
  assert.equal(PROFILE_MANAGER_STATUS_BAR_DESCRIPTOR.command, EXTENSION_COMMAND_IDS.openProfileManager);
  assert.equal(PROFILE_MANAGER_STATUS_BAR_DESCRIPTOR.text, '$(ai-commit-lite-status-bar) AI Commit Lite');
});


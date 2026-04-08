import assert from 'node:assert/strict';
import test from 'node:test';
import {
  getAutoFallbackSuccessDescriptor,
  getCommitGenerationErrorDescriptor,
  getCommitProgressMessageDescriptor,
  getCommitProgressTitleDescriptor,
  getCommitGenerationSuccessDescriptor,
  getConfigurationErrorDescriptor,
  getProfileDeleteErrorDescriptor,
  getProfileDeleteSuccessDescriptor,
  getProfileSaveErrorDescriptor,
  getProfileSaveSuccessDescriptor,
  getProfileSwitchErrorDescriptor,
  getProfileSwitchSuccessDescriptor,
  getUnexpectedCommandErrorDescriptor,
  hasDiffContextOptimization
} from '../../src/commands/commandMessageDescriptors';
import type { DiffContextReport } from '../../src/git/diff';

function createReport(overrides: Partial<DiffContextReport> = {}): DiffContextReport {
  return {
    totalFiles: 3,
    includedFiles: ['src/a.ts', 'src/b.ts', 'src/c.ts'],
    filteredFiles: [],
    truncatedFiles: [],
    summarizedFiles: [],
    totalPromptCharacters: 120,
    ...overrides
  };
}

test('getCommitGenerationSuccessDescriptor returns the plain success message when no optimization happened', () => {
  const descriptor = getCommitGenerationSuccessDescriptor(createReport());

  assert.deepEqual(descriptor, { key: 'commitMessageFilled' });
  assert.equal(hasDiffContextOptimization(createReport()), false);
});

test('getCommitGenerationSuccessDescriptor returns the optimized success message with counts', () => {
  const descriptor = getCommitGenerationSuccessDescriptor(createReport({
    filteredFiles: [{ file: 'package-lock.json', reason: 'filtered by contextExcludePatterns' }],
    summarizedFiles: ['src/large.ts']
  }));

  assert.deepEqual(descriptor, {
    key: 'commitMessageFilledOptimized',
    params: {
      filtered: 1,
      truncated: 0,
      summarized: 1
    }
  });
  assert.equal(hasDiffContextOptimization(createReport({ truncatedFiles: ['src/a.ts'] })), true);
});

test('profile-related success descriptors map to the expected message keys', () => {
  assert.deepEqual(
    getAutoFallbackSuccessDescriptor('OpenAI', 'DeepSeek'),
    {
      key: 'autoFallbackSuccess',
      params: {
        oldProfile: 'OpenAI',
        newProfile: 'DeepSeek'
      }
    }
  );
  assert.deepEqual(
    getProfileSaveSuccessDescriptor(true, 'Demo'),
    { key: 'profileAdded', params: { label: 'Demo' } }
  );
  assert.deepEqual(
    getProfileSaveSuccessDescriptor(false, 'Demo'),
    { key: 'profileUpdated', params: { label: 'Demo' } }
  );
  assert.deepEqual(
    getProfileDeleteSuccessDescriptor('Demo'),
    { key: 'profileDeleted', params: { label: 'Demo' } }
  );
  assert.deepEqual(
    getProfileSwitchSuccessDescriptor('Demo'),
    { key: 'profileSwitched', params: { profile: 'Demo' } }
  );
});

test('command error descriptors map to the expected error keys', () => {
  assert.deepEqual(
    getConfigurationErrorDescriptor('Bad max tokens'),
    { key: 'configurationError', params: { errors: 'Bad max tokens' } }
  );
  assert.deepEqual(
    getCommitGenerationErrorDescriptor('Network error'),
    { key: 'failedToGenerateCommitMessage', params: { message: 'Network error' } }
  );
  assert.deepEqual(
    getUnexpectedCommandErrorDescriptor('Boom'),
    { key: 'errorPrefix', params: { message: 'Boom' } }
  );
  assert.deepEqual(
    getProfileSaveErrorDescriptor('Bad request'),
    { key: 'failedToSaveProfile', params: { message: 'Bad request' } }
  );
  assert.deepEqual(
    getProfileDeleteErrorDescriptor('Permission denied'),
    { key: 'failedToDeleteProfile', params: { message: 'Permission denied' } }
  );
  assert.deepEqual(
    getProfileSwitchErrorDescriptor('Profile missing'),
    { key: 'failedToSwitchProfile', params: { message: 'Profile missing' } }
  );
});

test('commit progress descriptors map to the expected progress keys', () => {
  assert.deepEqual(getCommitProgressTitleDescriptor(), { key: 'generatingCommitMessage' });
  assert.deepEqual(getCommitProgressMessageDescriptor('collecting'), { key: 'collectingStagedChanges' });
  assert.deepEqual(getCommitProgressMessageDescriptor('requesting'), { key: 'sendingCommitRequest' });
  assert.deepEqual(getCommitProgressMessageDescriptor('complete'), { key: 'complete' });
});
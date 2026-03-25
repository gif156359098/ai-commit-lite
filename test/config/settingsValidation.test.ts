import assert from 'node:assert/strict';
import test from 'node:test';
import { createDefaultAICommitConfig } from '../../src/config/settingsDefaults';
import { collectConfigValidationIssues } from '../../src/config/settingsValidation';

test('collectConfigValidationIssues returns no issues for default config', () => {
  assert.deepEqual(collectConfigValidationIssues(createDefaultAICommitConfig()), []);
});

test('collectConfigValidationIssues returns all expected issue keys for invalid values', () => {
  const issues = collectConfigValidationIssues({
    ...createDefaultAICommitConfig(),
    temperature: 3,
    maxTokens: 10,
    maxDiffCharacters: 100,
    maxFileDiffCharacters: 100000
  });

  assert.deepEqual(
    issues.map((issue) => issue.key),
    [
      'temperatureRange',
      'maxTokensRange',
      'maxDiffCharactersRange',
      'maxFileDiffCharactersRange'
    ]
  );
  assert.deepEqual(issues[2]?.params, { min: 4000, max: 200000 });
  assert.deepEqual(issues[3]?.params, { min: 1000, max: 50000 });
});

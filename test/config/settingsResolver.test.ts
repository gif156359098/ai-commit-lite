import assert from 'node:assert/strict';
import test from 'node:test';
import { resolveAICommitConfig } from '../../src/config/settingsResolver';

test('resolveAICommitConfig uses defaults for missing values and clones pattern arrays', () => {
  const config = resolveAICommitConfig((_, defaultValue) => defaultValue);

  assert.equal(config.language, 'en');
  assert.equal(config.commitMessageStyle, 'detailed');
  assert.ok(Array.isArray(config.contextExcludePatterns));

  config.contextExcludePatterns.push('**/*.tmp');

  const secondConfig = resolveAICommitConfig((_, defaultValue) => defaultValue);
  assert.equal(secondConfig.contextExcludePatterns.includes('**/*.tmp'), false);
});

test('resolveAICommitConfig applies custom values from the reader', () => {
  const config = resolveAICommitConfig((key, defaultValue) => {
    const values: Record<string, unknown> = {
      language: 'zh-cn',
      temperature: 1.1,
      maxTokens: 1800,
      contextExcludePatterns: ['**/*.log']
    };

    return (key in values ? values[key] : defaultValue) as typeof defaultValue;
  });

  assert.equal(config.language, 'zh-cn');
  assert.equal(config.temperature, 1.1);
  assert.equal(config.maxTokens, 1800);
  assert.deepEqual(config.contextExcludePatterns, ['**/*.log']);
});

import assert from 'node:assert/strict';
import test from 'node:test';
import { matchesAnyGlob, matchesGlob } from '../../src/utils/glob';

test('matchesGlob supports recursive ** patterns with Windows-style separators', () => {
  assert.equal(
    matchesGlob('src\\commands\\profileManagerPanel.ts', '**/profileManagerPanel.ts'),
    true
  );
});

test('matchesGlob returns false for unrelated patterns', () => {
  assert.equal(
    matchesGlob('src/ai/openai.ts', '**/*.md'),
    false
  );
});

test('matchesAnyGlob returns true when any pattern matches', () => {
  assert.equal(
    matchesAnyGlob('resources/icons/ai-commit-lite-icons.woff', ['**/*.png', '**/*.woff']),
    true
  );
});


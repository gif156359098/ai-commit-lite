import assert from 'node:assert/strict';
import test from 'node:test';
import { addGitmojiToMessage, removeGitmojiFromMessage } from '../../src/commit/gitmoji';

test('addGitmojiToMessage normalizes existing gitmoji prefixes for conventional commits', () => {
  assert.equal(
    addGitmojiToMessage('🎉 init: bootstrap repository'),
    '🎉 init: bootstrap repository'
  );
});

test('addGitmojiToMessage preserves non-conventional messages that already have an emoji', () => {
  assert.equal(
    addGitmojiToMessage('🚀 ship the release'),
    '🚀 ship the release'
  );
});

test('removeGitmojiFromMessage strips the leading gitmoji cleanly', () => {
  assert.equal(
    removeGitmojiFromMessage('✨ feat: add profile onboarding'),
    'feat: add profile onboarding'
  );
});

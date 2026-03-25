import assert from 'node:assert/strict';
import test from 'node:test';
import { isQuotaError } from '../../src/commands/quotaError';

test('isQuotaError returns true for HTTP 429 responses', () => {
  assert.equal(
    isQuotaError({
      response: {
        status: 429
      }
    }),
    true
  );
});

test('isQuotaError returns true for rate limit style messages', () => {
  assert.equal(
    isQuotaError(new Error('OpenAI API error: rate limit exceeded')),
    true
  );
});

test('isQuotaError returns false for unrelated failures', () => {
  assert.equal(
    isQuotaError(new Error('network timeout')),
    false
  );
});

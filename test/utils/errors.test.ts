import assert from 'node:assert/strict';
import { test } from 'node:test';

import { isRetryableError } from '../../src/utils/errors';

interface AxiosLike {
  response?: { status: number };
  code?: string;
  isAxiosError?: boolean;
  name?: string;
}

function makeAxiosError(status: number): Error & AxiosLike {
  const error = new Error(`Request failed with status code ${status}`) as Error & AxiosLike;
  error.response = { status };
  error.isAxiosError = true;
  return error;
}

test('isRetryableError returns false for all 4xx client errors except 429', () => {
  assert.equal(isRetryableError(makeAxiosError(400)), false);
  assert.equal(isRetryableError(makeAxiosError(401)), false);
  assert.equal(isRetryableError(makeAxiosError(403)), false);
  assert.equal(isRetryableError(makeAxiosError(404)), false);
  assert.equal(isRetryableError(makeAxiosError(422)), false);
});

test('isRetryableError returns true for 429 rate limits and 5xx server errors', () => {
  assert.equal(isRetryableError(makeAxiosError(429)), true);
  assert.equal(isRetryableError(makeAxiosError(500)), true);
  assert.equal(isRetryableError(makeAxiosError(502)), true);
  assert.equal(isRetryableError(makeAxiosError(503)), true);
});

test('isRetryableError treats endpoint misconfigurations as not retryable', () => {
  const dnsError = new Error('getaddrinfo ENOTFOUND') as Error & AxiosLike;
  dnsError.code = 'ENOTFOUND';
  dnsError.isAxiosError = true;
  assert.equal(isRetryableError(dnsError), false);

  const refusedError = new Error('connect ECONNREFUSED') as Error & AxiosLike;
  refusedError.code = 'ECONNREFUSED';
  refusedError.isAxiosError = true;
  assert.equal(isRetryableError(refusedError), false);
});

test('isRetryableError treats cancellations and unknown errors conservatively', () => {
  const cancelled = new Error('canceled') as Error & AxiosLike;
  cancelled.name = 'CanceledError';
  assert.equal(isRetryableError(cancelled), false);

  // 未知错误保持可重试（后端超时等无法归类的情况）
  assert.equal(isRetryableError(new Error('something broke')), true);
  assert.equal(isRetryableError(null), true);
});

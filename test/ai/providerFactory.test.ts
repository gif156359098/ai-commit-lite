import assert from 'node:assert/strict';
import { test } from 'node:test';

import { validateProviderEndpoint } from '../../src/ai/providerFactory';

test('validateProviderEndpoint accepts official https endpoints', () => {
  assert.doesNotThrow(() => validateProviderEndpoint('https://api.openai.com/v1'));
  assert.doesNotThrow(() => validateProviderEndpoint('https://api.deepseek.com/v1'));
  assert.doesNotThrow(() => validateProviderEndpoint('https://dashscope.aliyuncs.com/compatible-mode/v1'));
  assert.doesNotThrow(() => validateProviderEndpoint(''));
});

test('validateProviderEndpoint allows http only for local hosts', () => {
  assert.doesNotThrow(() => validateProviderEndpoint('http://localhost:11434/v1'));
  assert.doesNotThrow(() => validateProviderEndpoint('http://127.0.0.1:8080'));
  assert.doesNotThrow(() => validateProviderEndpoint('http://[::1]:1234/v1'));
});

test('validateProviderEndpoint rejects insecure http endpoints on non-local hosts', () => {
  assert.throws(() => validateProviderEndpoint('http://api.evil.com/v1'));
  assert.throws(() => validateProviderEndpoint('http://192.168.1.10:8080'));
});

test('validateProviderEndpoint rejects malformed or non-http protocols', () => {
  assert.throws(() => validateProviderEndpoint('not-a-url'));
  assert.throws(() => validateProviderEndpoint('ftp://api.example.com/v1'));
  assert.throws(() => validateProviderEndpoint('file:///etc/passwd'));
});

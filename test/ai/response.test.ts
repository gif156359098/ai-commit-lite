import assert from 'node:assert/strict';
import test from 'node:test';
import {
  extractOpenAICompatibleMessage,
  shouldRetryOpenAICompatibleMessage
} from '../../src/ai/response';

test('extractOpenAICompatibleMessage returns content from choices.message.content', () => {
  const message = extractOpenAICompatibleMessage({
    choices: [
      {
        message: {
          content: 'feat: add provider tests'
        }
      }
    ]
  });

  assert.equal(message, 'feat: add provider tests');
});

test('extractOpenAICompatibleMessage surfaces reasoning token exhaustion clearly', () => {
  const response = {
    choices: [
      {
        finish_reason: 'length',
        message: {
          content: '',
          reasoning_content: 'thinking'
        }
      }
    ]
  };

  assert.equal(shouldRetryOpenAICompatibleMessage(response), true);
  assert.throws(
    () => extractOpenAICompatibleMessage(response, 'https://api.example.com/v1', 1000),
    /Increase Max Tokens/
  );
});

test('extractOpenAICompatibleMessage explains HTML endpoint mistakes', () => {
  assert.throws(
    () => extractOpenAICompatibleMessage('<html><body>wrong endpoint</body></html>', 'https://www.dmxapi.cn/chat'),
    /https:\/\/www\.dmxapi\.cn\/v1/
  );
});

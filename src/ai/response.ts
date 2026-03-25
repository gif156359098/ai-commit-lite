export function extractOpenAICompatibleMessage(
  data: unknown,
  endpoint?: string,
  requestedMaxTokens?: number
): string {
  if (looksLikeHtmlDocument(data)) {
    throw new Error(buildHtmlResponseMessage(endpoint));
  }

  const response = asRecord(data);

  const outputText = extractText(response?.output_text);
  if (outputText) {
    return outputText;
  }

  const rootMessage = extractText(response?.message);
  if (rootMessage) {
    return rootMessage;
  }

  const choices = asArray(response?.choices);
  for (const choice of choices) {
    const choiceRecord = asRecord(choice);
    const messageContent = extractText(asRecord(choiceRecord?.message)?.content);

    if (messageContent) {
      return messageContent;
    }

    const deltaContent = extractText(asRecord(choiceRecord?.delta)?.content);
    if (deltaContent) {
      return deltaContent;
    }

    const choiceText = extractText(choiceRecord?.text);
    if (choiceText) {
      return choiceText;
    }
  }

  const output = asArray(response?.output);
  for (const item of output) {
    const itemRecord = asRecord(item);
    const content = extractText(itemRecord?.content);

    if (content) {
      return content;
    }
  }

  const directContent = extractText(response?.content);
  if (directContent) {
    return directContent;
  }

  if (isTruncatedReasoningResponse(response)) {
    throw new Error(buildReasoningTokenLimitMessage(requestedMaxTokens));
  }

  throw new Error(`Unexpected response format: ${summarizeResponse(data)}`);
}

export function shouldRetryOpenAICompatibleMessage(data: unknown): boolean {
  return isTruncatedReasoningResponse(asRecord(data));
}

export function extractGeminiMessage(data: unknown): string {
  const response = asRecord(data);
  const candidates = asArray(response?.candidates);

  for (const candidate of candidates) {
    const candidateRecord = asRecord(candidate);
    const content = extractText(asRecord(candidateRecord?.content)?.parts);

    if (content) {
      return content;
    }
  }

  const promptFeedback = asRecord(response?.promptFeedback);
  const blockReason = asString(promptFeedback?.blockReason);

  if (blockReason) {
    throw new Error(`Gemini returned no content. Block reason: ${blockReason}`);
  }

  throw new Error(`Unexpected response format: ${summarizeResponse(data)}`);
}

export function cleanCommitMessage(message: string): string {
  return message
    .replace(/^"|"$/g, '')
    .replace(/^'|'$/g, '')
    .trim();
}

export function getProviderErrorMessage(error: any, endpoint?: string): string {
  const responseData = error?.response?.data;

  if (looksLikeHtmlDocument(responseData)) {
    return buildHtmlResponseMessage(endpoint ?? error?.config?.url);
  }

  return responseData?.error?.message
    || responseData?.message
    || error?.message
    || summarizeResponse(responseData)
    || 'Unknown API error';
}

function extractText(value: unknown): string {
  const stringValue = asString(value);
  if (stringValue) {
    return stringValue.trim();
  }

  const arrayValue = asArray(value);
  if (arrayValue.length > 0) {
    const parts = arrayValue
      .map((item) => extractText(item))
      .filter((item) => item.length > 0);

    if (parts.length > 0) {
      return parts.join('\n').trim();
    }
  }

  const recordValue = asRecord(value);
  if (!recordValue) {
    return '';
  }

  const textFields = [
    recordValue.text,
    recordValue.content,
    recordValue.output_text
  ];

  for (const field of textFields) {
    const text = extractText(field);
    if (text) {
      return text;
    }
  }

  if (recordValue.type === 'text') {
    const typedText = extractText(recordValue.text);
    if (typedText) {
      return typedText;
    }
  }

  const nestedFields = [
    recordValue.parts,
    recordValue.content,
    recordValue.message,
    recordValue.delta
  ];

  for (const field of nestedFields) {
    const text = extractText(field);
    if (text) {
      return text;
    }
  }

  return '';
}

function summarizeResponse(data: unknown): string {
  try {
    const serialized = JSON.stringify(data);

    if (!serialized) {
      return String(data);
    }

    return serialized.length > 500
      ? `${serialized.slice(0, 497)}...`
      : serialized;
  } catch {
    return String(data);
  }
}

function buildReasoningTokenLimitMessage(requestedMaxTokens?: number): string {
  const currentLimit = typeof requestedMaxTokens === 'number'
    ? ` Current Max Tokens: ${requestedMaxTokens}.`
    : '';

  return `The model used all output tokens on reasoning and did not return a final commit message.${currentLimit} Increase Max Tokens in AI Commit Lite settings and try again, or switch to a non-reasoning chat model.`;
}

function buildHtmlResponseMessage(endpoint?: string): string {
  const baseMessage = 'Received an HTML page instead of JSON. This usually means the API endpoint is pointing to a website page rather than an OpenAI-compatible API base URL.';
  const normalizedEndpoint = endpoint?.trim() ?? '';

  if (normalizedEndpoint.includes('dmxapi.cn')) {
    return `${baseMessage} For DMXAPI, use https://www.dmxapi.cn/v1 as the API endpoint.`;
  }

  return `${baseMessage} Try configuring an endpoint that ends with /v1.`;
}

function looksLikeHtmlDocument(data: unknown): boolean {
  if (typeof data !== 'string') {
    return false;
  }

  const trimmed = data.trim().toLowerCase();
  return trimmed.startsWith('<!doctype html') || trimmed.startsWith('<html');
}

function isTruncatedReasoningResponse(response: Record<string, any> | undefined): boolean {
  if (!response) {
    return false;
  }

  const choices = asArray(response.choices);

  for (const choice of choices) {
    const choiceRecord = asRecord(choice);
    const message = asRecord(choiceRecord?.message);
    const content = extractText(message?.content);
    const finishReason = asString(choiceRecord?.finish_reason);
    const reasoningContent = extractText(
      message?.reasoning_content
      ?? choiceRecord?.reasoning_content
      ?? choiceRecord?.reasoning
    );

    if (!content && reasoningContent && finishReason === 'length') {
      return true;
    }
  }

  return false;
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function asRecord(value: unknown): Record<string, any> | undefined {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, any>
    : undefined;
}

function asString(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined;
}


export function isQuotaError(error: unknown): boolean {
  const response = asRecord(asRecord(error)?.response);
  const message = String(asRecord(error)?.message ?? '').toLowerCase();

  return response?.status === 429
    || message.includes('429')
    || message.includes('quota')
    || message.includes('rate limit')
    || message.includes('too many requests');
}

function asRecord(value: unknown): Record<string, any> | undefined {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, any>
    : undefined;
}

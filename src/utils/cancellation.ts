import axios from 'axios';

import { getErrorMessage } from './errors';

export function isCancellationError(error: unknown): boolean {
  if (axios.isCancel(error)) {
    return true;
  }

  if (error === null || error === undefined) {
    return false;
  }

  const details = error as {
    code?: unknown;
    name?: unknown;
  };
  const code = typeof details.code === 'string' ? details.code : '';
  const name = typeof details.name === 'string' ? details.name : '';
  const message = getErrorMessage(error).toLowerCase();

  return code === 'ABORT_ERR'
    || code === 'ERR_CANCELED'
    || name === 'AbortError'
    || message.includes('cancelled')
    || message.includes('canceled')
    || message.includes('aborted');
}

export function getCancellationReason(
  error: unknown,
  fallback: string = 'Request cancelled by user'
): string {
  const message = getErrorMessage(error).trim();

  return message.length > 0 ? message : fallback;
}

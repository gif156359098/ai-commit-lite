export function getErrorMessage(error: unknown): string {
  if (typeof error === 'string') {
    return error;
  }

  if (error instanceof Error) {
    return error.message;
  }

  if (error === null || error === undefined) {
    return 'Unknown error';
  }

  return String(error);
}

export function toError(error: unknown): Error {
  return error instanceof Error
    ? error
    : new Error(getErrorMessage(error));
}

type AxiosLikeError = {
  response?: { status?: number; statusText?: string; data?: unknown };
  code?: string;
  isAxiosError?: boolean;
};

/**
 * Extracts detailed error information for logging/debugging.
 */
export function getDetailedErrorInfo(error: unknown): string {
  const basicMessage = getErrorMessage(error);

  if (error instanceof Error) {
    const axiosError = error as unknown as AxiosLikeError;

    if (axiosError.isAxiosError || axiosError.response) {
      const parts: string[] = [basicMessage];

      if (axiosError.response?.status) {
        parts.push(`HTTP ${axiosError.response.status} ${axiosError.response.statusText || ''}`);
      }

      if (axiosError.code) {
        parts.push(`code: ${axiosError.code}`);
      }

      const responseData = axiosError.response?.data;
      if (responseData && typeof responseData === 'object' && !Array.isArray(responseData)) {
        const data = responseData as Record<string, unknown>;
        const errorObj = data?.error;
        let errorMsg: string | undefined;
        if (errorObj && typeof errorObj === 'object' && !Array.isArray(errorObj)) {
          const e = errorObj as Record<string, unknown>;
          errorMsg = (e?.message as string) || (e?.code as string);
        }
        errorMsg ||= data?.message as string | undefined;
        if (errorMsg) {
          parts.push(`detail: ${errorMsg}`);
        }
        if (data?.['retry-after'] || data?.['x-ratelimit-remaining'] === '0') {
          parts.push('rate limit exceeded');
        }
      }

      return parts.join(' | ');
    }
  }

  return basicMessage;
}

export function isAuthError(error: unknown): boolean {
  if (error instanceof Error) {
    const axiosError = error as unknown as AxiosLikeError;
    if (axiosError.response?.status) {
      return axiosError.response.status === 401 || axiosError.response.status === 403;
    }
  }
  return false;
}

/**
 * Determines if an error is retryable (indicating server/network issues).
 * Non-retryable errors (auth failures, client errors) should not trigger fallback.
 */
export function isRetryableError(error: unknown): boolean {
  if (error instanceof Error) {
    const axiosError = error as unknown as AxiosLikeError & { message?: string };

    // Any 4xx client error (except 429 rate limit) is NOT retryable:
    // it indicates a configuration/model/endpoint problem that a different
    // profile would almost certainly reproduce, and treating unknown 4xx as
    // retryable would let a hostile endpoint trigger fallback requests to
    // more profiles (amplifying the EXFILTRATION surface).
    if (axiosError.response?.status) {
      const status = axiosError.response.status;
      return status >= 500 || status === 429;
    }

    // Connection aborted / timeout - retryable
    if (axiosError.code === 'ECONNABORTED' || axiosError.code?.startsWith('ETIMEDOUT')) {
      return true;
    }

    // DNS / connection refused - NOT retryable, endpoint is wrong
    if (axiosError.code === 'ENOTFOUND' || axiosError.code === 'ECONNREFUSED') {
      return false;
    }

    // Timeout in error message - retryable
    if (axiosError.message?.includes('timed out') || axiosError.message?.includes('timeout')) {
      return true;
    }

    // Connection reset - retryable
    if (axiosError.code === 'ECONNRESET') {
      return true;
    }

    // Cancelled by user - not retryable
    if (error.name === 'CanceledError') {
      return false;
    }
  }

  // Unknown errors - be conservative and allow retry
  return true;
}
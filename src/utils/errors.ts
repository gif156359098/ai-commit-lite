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

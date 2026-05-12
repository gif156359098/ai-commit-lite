/**
 * Centralized constants for AI provider API configurations.
 * These constants are extracted to ensure consistency across provider implementations.
 */

/**
 * Azure OpenAI API version for chat completions endpoint.
 * Reference: https://learn.microsoft.com/en-us/azure/ai-services/openai/reference
 */
export const AZURE_API_VERSION = '2023-05-15';

/**
 * Anthropic API version for messages endpoint.
 * Reference: https://docs.anthropic.com/en/api/reference
 */
export const ANTHROPIC_API_VERSION = '2023-06-01';

/**
 * Connection test configuration constants.
 */
export const CONNECTION_TEST_CONFIG = {
  /** Number of tokens to request during connection test (enough for a short response) */
  maxTokens: 20,
  /** Request timeout in milliseconds */
  timeoutMs: 30_000
} as const;
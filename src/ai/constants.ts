/**
 * Centralized constants for AI provider API configurations.
 * These constants are extracted to ensure consistency across provider implementations.
 */

/**
 * Azure OpenAI API version for chat completions endpoint.
 *
 * 2023-05-15 已过旧：新部署（gpt-4o/4.1/5 系列）需要 2024-10-21 之后的版本。
 * 2025-08 起 Azure 官方还提供无需 api-version 的 v1 API
 * （端点形如 https://<resource>.openai.azure.com/openai/v1，见
 * https://learn.microsoft.com/en-us/azure/foundry/openai/api-version-lifecycle）。
 * 用户若把 api-version 以 query 形式写入 baseUrl，代码会优先使用用户值。
 */
export const AZURE_API_VERSION = '2025-04-01-preview';

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
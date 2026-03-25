import { t } from '../i18n';
import {
  createDefaultAICommitConfig,
  DEFAULT_AI_COMMIT_CONFIG,
  DEFAULT_CONTEXT_EXCLUDE_PATTERNS,
  DEFAULT_MAX_DIFF_CHARACTERS,
  DEFAULT_MAX_FILE_DIFF_CHARACTERS,
  MAX_MAX_DIFF_CHARACTERS,
  MAX_MAX_FILE_DIFF_CHARACTERS,
  MIN_MAX_DIFF_CHARACTERS,
  MIN_MAX_FILE_DIFF_CHARACTERS
} from './settingsDefaults';
import { resolveAICommitConfig } from './settingsResolver';
import { collectConfigValidationIssues } from './settingsValidation';
import { AICommitConfig, CommitMessageStyle } from './settingsTypes';
import { readAICommitConfigValue } from './workspaceConfig';

export {
  createDefaultAICommitConfig,
  DEFAULT_AI_COMMIT_CONFIG,
  DEFAULT_CONTEXT_EXCLUDE_PATTERNS,
  DEFAULT_MAX_DIFF_CHARACTERS,
  DEFAULT_MAX_FILE_DIFF_CHARACTERS,
  MAX_MAX_DIFF_CHARACTERS,
  MAX_MAX_FILE_DIFF_CHARACTERS,
  MIN_MAX_DIFF_CHARACTERS,
  MIN_MAX_FILE_DIFF_CHARACTERS
};

export type { AICommitConfig, CommitMessageStyle };

export function getConfig(): AICommitConfig {
  return resolveAICommitConfig(readAICommitConfigValue);
}

export function validateConfig(config: AICommitConfig): { valid: boolean; errors: string[] } {
  const errors = collectConfigValidationIssues(config)
    .map((issue) => t(issue.key, issue.params));

  return {
    valid: errors.length === 0,
    errors
  };
}

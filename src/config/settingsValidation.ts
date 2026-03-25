import {
  MAX_MAX_DIFF_CHARACTERS,
  MAX_MAX_FILE_DIFF_CHARACTERS,
  MIN_MAX_DIFF_CHARACTERS,
  MIN_MAX_FILE_DIFF_CHARACTERS
} from './settingsDefaults';
import { AICommitConfig } from './settingsTypes';

export interface ConfigValidationIssue {
  key: string;
  params?: Record<string, string | number>;
}

export function collectConfigValidationIssues(config: AICommitConfig): ConfigValidationIssue[] {
  const issues: ConfigValidationIssue[] = [];

  if (config.temperature < 0 || config.temperature > 2) {
    issues.push({ key: 'temperatureRange' });
  }

  if (config.maxTokens < 100 || config.maxTokens > 4000) {
    issues.push({ key: 'maxTokensRange' });
  }

  if (
    config.maxDiffCharacters < MIN_MAX_DIFF_CHARACTERS
    || config.maxDiffCharacters > MAX_MAX_DIFF_CHARACTERS
  ) {
    issues.push({
      key: 'maxDiffCharactersRange',
      params: {
        min: MIN_MAX_DIFF_CHARACTERS,
        max: MAX_MAX_DIFF_CHARACTERS
      }
    });
  }

  if (
    config.maxFileDiffCharacters < MIN_MAX_FILE_DIFF_CHARACTERS
    || config.maxFileDiffCharacters > MAX_MAX_FILE_DIFF_CHARACTERS
  ) {
    issues.push({
      key: 'maxFileDiffCharactersRange',
      params: {
        min: MIN_MAX_FILE_DIFF_CHARACTERS,
        max: MAX_MAX_FILE_DIFF_CHARACTERS
      }
    });
  }

  return issues;
}

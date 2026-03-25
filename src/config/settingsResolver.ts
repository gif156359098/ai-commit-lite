import { AICommitConfig, CommitMessageStyle } from './settingsTypes';
import { createDefaultAICommitConfig } from './settingsDefaults';

export type ConfigValueReader = <T>(key: string, defaultValue: T) => T;

export function resolveAICommitConfig(readValue: ConfigValueReader): AICommitConfig {
  const defaults = createDefaultAICommitConfig();

  return {
    language: readValue('language', defaults.language),
    useGitmoji: readValue('useGitmoji', defaults.useGitmoji),
    customSystemPrompt: readValue('customSystemPrompt', defaults.customSystemPrompt),
    conventionalCommits: readValue('conventionalCommits', defaults.conventionalCommits),
    commitMessageStyle: readValue<CommitMessageStyle>('commitMessageStyle', defaults.commitMessageStyle),
    temperature: readValue('temperature', defaults.temperature),
    maxTokens: readValue('maxTokens', defaults.maxTokens),
    contextExcludePatterns: [...readValue('contextExcludePatterns', defaults.contextExcludePatterns)],
    maxDiffCharacters: readValue('maxDiffCharacters', defaults.maxDiffCharacters),
    maxFileDiffCharacters: readValue('maxFileDiffCharacters', defaults.maxFileDiffCharacters)
  };
}

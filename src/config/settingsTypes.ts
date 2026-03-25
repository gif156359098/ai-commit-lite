export type CommitMessageStyle = 'detailed' | 'concise';

export interface AICommitConfig {
  language: string;
  useGitmoji: boolean;
  customSystemPrompt: string;
  conventionalCommits: boolean;
  commitMessageStyle: CommitMessageStyle;
  temperature: number;
  maxTokens: number;
  contextExcludePatterns: string[];
  maxDiffCharacters: number;
  maxFileDiffCharacters: number;
}

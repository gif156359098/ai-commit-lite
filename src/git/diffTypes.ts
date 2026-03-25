export interface GitDiff {
  raw: string;
  files: GitFile[];
  summary: string;
}

export interface GitFile {
  status: string;
  path: string;
  additions: number;
  deletions: number;
  changes: string;
  isBinary: boolean;
}

export interface PreparedGitDiff {
  raw: string;
  files: GitFile[];
  summary: string;
  prompt: string;
  report: DiffContextReport;
}

export interface DiffContextOptions {
  excludePatterns: string[];
  maxDiffCharacters: number;
  maxFileDiffCharacters: number;
}

export interface DiffContextReport {
  totalFiles: number;
  includedDiffFiles: number;
  filteredFiles: number;
  truncatedFiles: number;
  summarizedFiles: number;
  totalPromptCharacters: number;
}

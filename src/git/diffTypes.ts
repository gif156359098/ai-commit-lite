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

export interface DiffContextFilteredFile {
  file: string;
  reason: string;
}

export interface DiffContextReport {
  totalFiles: number;
  includedFiles: string[];
  filteredFiles: DiffContextFilteredFile[];
  truncatedFiles: string[];
  summarizedFiles: string[];
  totalPromptCharacters: number;
}

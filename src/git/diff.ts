import { execFile } from 'child_process';

import { t } from '../i18n';
import { isCancellationError } from '../utils/cancellation';
import { matchesAnyGlob } from '../utils/glob';
import { buildPreparedDiffContext, generateSummary, getFilePriority } from './diffContextBuilder';
import { parseStagedFiles } from './diffParsing';
import { DiffContextOptions, GitDiff, GitFile, PreparedGitDiff } from './diffTypes';
import { getGitRepositoryRoot } from './repository';

const GIT_MAX_BUFFER = 20 * 1024 * 1024;
const DIFF_CONTEXT_LINES = 1;

export type {
  DiffContextOptions,
  DiffContextFilteredFile,
  DiffContextReport,
  GitDiff,
  GitFile,
  PreparedGitDiff
} from './diffTypes';

export async function getPreparedStagedDiff(
  options: DiffContextOptions,
  abortSignal?: AbortSignal
): Promise<PreparedGitDiff> {
  try {
    const cwd = await getGitRepositoryRoot();
    const files = await getStagedFiles(cwd, abortSignal);

    // Pre-filter files based on metadata to optimize patch fetching
    const preFilterResult = preFilterFiles(files, options);
    const { needsPatch } = preFilterResult;

    // Only fetch patches for files that need them
    if (needsPatch.size === 0) {
      const patchMap = new Map<string, string>();
      return buildPreparedDiffContext(files, patchMap, options);
    }

    const patchMap = await getSelectivePatchMap(cwd, needsPatch, abortSignal);
    return buildPreparedDiffContext(files, patchMap, options);
  } catch (error: any) {
    if (isCancellationError(error)) {
      throw error;
    }

    throw new Error(t('failedToGetGitDiff', { message: error.message }));
  }
}

/**
 * Pre-filters files based on metadata and options, without fetching patches.
 * Returns which files need patches and why some files are excluded.
 */
export function preFilterFiles(
  files: GitFile[],
  options: DiffContextOptions
): PreFilterResult {
  const needsPatch = new Set<string>();
  const noPatchReasons = new Map<string, string>();

  const orderedFiles = [...files].sort((left, right) => {
    const priorityDifference = getFilePriority(left.path) - getFilePriority(right.path);

    if (priorityDifference !== 0) {
      return priorityDifference;
    }

    return left.path.localeCompare(right.path);
  });

  // Estimate available budget based on options
  // We reserve some buffer for the overall prompt structure
  const reservedBudgetChars = 500;
  const effectiveMaxDiffChars = Math.max(0, options.maxDiffCharacters - reservedBudgetChars);
  let estimatedCharsUsed = 0;

  for (const file of orderedFiles) {
    // Check exclude patterns
    if (matchesAnyGlob(file.path, options.excludePatterns)) {
      noPatchReasons.set(file.path, 'filtered by contextExcludePatterns');
      continue;
    }

    // Binary files don't need patch content
    if (file.isBinary) {
      noPatchReasons.set(file.path, 'binary file');
      continue;
    }

    // Estimate patch size based on line changes
    const estimatedPatchSize = estimatePatchSize(file);

    // Check per-file limit - truncated patches still need fetching
    const wouldBeTruncated = estimatedPatchSize > options.maxFileDiffCharacters;

    // Check if this file would exhaust the remaining budget
    const remainingBudget = effectiveMaxDiffChars - estimatedCharsUsed;
    const minRequiredChars = Math.min(wouldBeTruncated ? options.maxFileDiffCharacters : estimatedPatchSize, estimatedPatchSize);

    // If no budget left, file will be summarized
    const wouldExhaustBudget = minRequiredChars > remainingBudget && remainingBudget < 100;

    // If file would be summarized anyway, no need to fetch patch
    if (wouldExhaustBudget) {
      noPatchReasons.set(file.path, 'exceeds context budget');
      continue;
    }

    // This file needs its patch content
    needsPatch.add(file.path);
    estimatedCharsUsed += wouldBeTruncated ? options.maxFileDiffCharacters : estimatedPatchSize;
  }

  return { needsPatch, noPatchReasons };
}

/**
 * Estimates the patch size based on file metadata.
 * This is a rough estimate to decide if we need to fetch the actual patch.
 */
function estimatePatchSize(file: GitFile): number {
  // Rough estimate: each changed line takes ~80 chars in diff format
  const avgCharsPerLine = 80;
  const headerOverhead = 100; // diff header, hunk headers

  return (file.additions + file.deletions) * avgCharsPerLine + headerOverhead;
}

async function getSelectivePatchMap(
  cwd: string,
  filePaths: Set<string>,
  abortSignal?: AbortSignal
): Promise<Map<string, string>> {
  const patchMap = new Map<string, string>();

  // Fetch patches for each file that needs it
  // We use individual file diffs to avoid fetching unneeded content
  const fileList = Array.from(filePaths);

  for (const filePath of fileList) {
    try {
      const patchOutput = await runGit(
        ['diff', '--cached', '--', filePath, `--unified=${DIFF_CONTEXT_LINES}`, '--no-color', '--no-renames'],
        cwd,
        abortSignal
      );

      if (patchOutput.trim()) {
        patchMap.set(filePath, patchOutput.trim());
      }
    } catch (error: any) {
      // Single file failure shouldn't stop the whole operation
      // Log and continue with other files
      console.warn(`Failed to get patch for ${filePath}: ${error.message}`);
    }
  }

  return patchMap;
}

export async function getStagedDiff(): Promise<GitDiff> {
  try {
    const cwd = await getGitRepositoryRoot();
    const files = await getStagedFiles(cwd);
    const diffOutput = await runGit(['diff', '--cached', '--no-color'], cwd);

    return {
      raw: diffOutput,
      files,
      summary: generateSummary(files)
    };
  } catch (error: any) {
    if (isCancellationError(error)) {
      throw error;
    }

    throw new Error(t('failedToGetGitDiff', { message: error.message }));
  }
}

export async function checkHasStagedChanges(abortSignal?: AbortSignal): Promise<boolean> {
  try {
    const cwd = await getGitRepositoryRoot();
    await runGit(['diff', '--cached', '--quiet'], cwd, abortSignal);
    return false;
  } catch (error: any) {
    if (isCancellationError(error)) {
      throw error;
    }

    if (error.code === 1) {
      return true;
    }

    throw new Error(t('failedToCheckStagedChanges', { message: error.message }));
  }
}

export async function commit(message: string): Promise<void> {
  try {
    const cwd = await getGitRepositoryRoot();
    await runGit(['commit', '-m', message], cwd);
  } catch (error: any) {
    if (isCancellationError(error)) {
      throw error;
    }

    throw new Error(t('failedToCommit', { message: error.message }));
  }
}

export interface PreFilterResult {
  needsPatch: Set<string>;
  noPatchReasons: Map<string, string>;
}

async function getStagedFiles(cwd: string, abortSignal?: AbortSignal): Promise<GitFile[]> {
  const nameStatusOutput = await runGit(
    ['diff', '--cached', '--name-status', '--no-renames'],
    cwd,
    abortSignal
  );
  const numStatOutput = await runGit(
    ['diff', '--cached', '--numstat', '--no-renames'],
    cwd,
    abortSignal
  );

  return parseStagedFiles(nameStatusOutput, numStatOutput);
}

async function runGit(
  args: string[],
  cwd: string,
  abortSignal?: AbortSignal
): Promise<string> {
  return await new Promise<string>((resolve, reject) => {
    execFile('git', args, {
      cwd,
      maxBuffer: GIT_MAX_BUFFER,
      signal: abortSignal
    }, (error, stdout) => {
      if (error) {
        reject(error);
        return;
      }

      resolve(stdout);
    });
  });
}
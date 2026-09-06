import { execFile } from 'child_process';

import { t } from '../i18n';
import { isCancellationError } from '../utils/cancellation';
import { matchesAnyGlob } from '../utils/glob';
import { buildPreparedDiffContext, generateSummary, getFilePriority } from './diffContextBuilder';
import { parseStagedFiles } from './diffParsing';
import { DiffContextOptions, GitDiff, GitFile, PreparedGitDiff } from './diffTypes';

const GIT_MAX_BUFFER = 20 * 1024 * 1024;
const DIFF_CONTEXT_LINES = 1;
// 与 diffContextBuilder.MIN_REMAINING_DIFF_CHARACTERS 对齐
// 使 preFilterFiles 的预算估算与 buildPreparedDiffContext 的最终判定一致，
// 避免 preFilter 乐观取回 patch 后又被降级为 summary 造成无谓的 git diff 调用。
const DIFF_RESERVED_BUDGET_CHARS = 800;

export type {
  DiffContextOptions,
  DiffContextFilteredFile,
  DiffContextReport,
  GitDiff,
  GitFile,
  PreparedGitDiff
} from './diffTypes';

export async function getPreparedStagedDiff(
  repositoryRoot: string,
  options: DiffContextOptions,
  abortSignal?: AbortSignal
): Promise<PreparedGitDiff> {
  try {
    const files = await getStagedFiles(repositoryRoot, abortSignal);

    // Pre-filter files based on metadata to optimize patch fetching
    const preFilterResult = preFilterFiles(files, options);
    const { needsPatch } = preFilterResult;

    // Only fetch patches for files that need them
    if (needsPatch.size === 0) {
      const patchMap = new Map<string, string>();
      return buildPreparedDiffContext(files, patchMap, options);
    }

    const patchMap = await getSelectivePatchMap(repositoryRoot, needsPatch, abortSignal);
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
    const reservedBudgetChars = DIFF_RESERVED_BUDGET_CHARS;
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
  const fileList = Array.from(filePaths);

  // Parallel fetch patches with controlled concurrency
  // Process in batches to avoid overwhelming system
  const BATCH_SIZE = 5;
  for (let i = 0; i < fileList.length; i += BATCH_SIZE) {
    const batch = fileList.slice(i, i + BATCH_SIZE);
    const promises = batch.map(async (filePath) => {
      try {
        const patchOutput = await runGit(
          ['diff', '--cached', '--', filePath, `--unified=${DIFF_CONTEXT_LINES}`, '--no-color', '--no-renames'],
          cwd,
          abortSignal
        );
        return { filePath, patch: patchOutput.trim() || null };
      } catch {
        // 单个文件 patch 抓取失败不阻断整体流程：该文件降级为 "summary only"，
        // 由 buildPreparedDiffContext 的汇总条目体现，不向控制台输出噪音。
        return { filePath, patch: null };
      }
    });

    const results = await Promise.all(promises);
    for (const result of results) {
      if (result.patch) {
        patchMap.set(result.filePath, result.patch);
      }
    }
  }

  return patchMap;
}

export async function getStagedDiff(repositoryRoot: string): Promise<GitDiff> {
  try {
    const [files, diffOutput] = await Promise.all([
      getStagedFiles(repositoryRoot),
      runGit(['diff', '--cached', '--no-color'], repositoryRoot)
    ]);

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

export async function checkHasStagedChanges(
  repositoryRoot: string,
  abortSignal?: AbortSignal
): Promise<boolean> {
  try {
    await runGit(['diff', '--cached', '--quiet'], repositoryRoot, abortSignal);
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

export interface PreFilterResult {
  needsPatch: Set<string>;
  noPatchReasons: Map<string, string>;
}

async function getStagedFiles(cwd: string, abortSignal?: AbortSignal): Promise<GitFile[]> {
  // Parallel fetch name-status and numstat for better performance
  const [nameStatusOutput, numStatOutput] = await Promise.all([
    runGit(['diff', '--cached', '--name-status', '--no-renames'], cwd, abortSignal),
    runGit(['diff', '--cached', '--numstat', '--no-renames'], cwd, abortSignal)
  ]);

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
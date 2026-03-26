import { execFile } from 'child_process';

import { t } from '../i18n';
import { isCancellationError } from '../utils/cancellation';
import { buildPreparedDiffContext, generateSummary } from './diffContextBuilder';
import { parsePatchMap, parseStagedFiles } from './diffParsing';
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
    const patchMap = await getStagedPatchMap(cwd, abortSignal);
    return buildPreparedDiffContext(files, patchMap, options);
  } catch (error: any) {
    if (isCancellationError(error)) {
      throw error;
    }

    throw new Error(t('failedToGetGitDiff', { message: error.message }));
  }
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

async function getStagedPatchMap(cwd: string, abortSignal?: AbortSignal): Promise<Map<string, string>> {
  const patchOutput = await runGit(
    ['diff', '--cached', `--unified=${DIFF_CONTEXT_LINES}`, '--no-color', '--no-renames'],
    cwd,
    abortSignal
  );

  return parsePatchMap(patchOutput);
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

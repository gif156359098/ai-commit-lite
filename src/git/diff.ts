import { execFile } from 'child_process';
import { promisify } from 'util';

import { t } from '../i18n';
import { buildPreparedDiffContext, generateSummary } from './diffContextBuilder';
import { parsePatchMap, parseStagedFiles } from './diffParsing';
import { DiffContextOptions, GitDiff, GitFile, PreparedGitDiff } from './diffTypes';
import { getGitRepositoryRoot } from './repository';

const execFileAsync = promisify(execFile);
const GIT_MAX_BUFFER = 20 * 1024 * 1024;
const DIFF_CONTEXT_LINES = 1;
export type {
  DiffContextOptions,
  DiffContextReport,
  GitDiff,
  GitFile,
  PreparedGitDiff
} from './diffTypes';

export async function getPreparedStagedDiff(
  options: DiffContextOptions
): Promise<PreparedGitDiff> {
  try {
    const cwd = await getGitRepositoryRoot();
    const files = await getStagedFiles(cwd);
    const patchMap = await getStagedPatchMap(cwd);
    return buildPreparedDiffContext(files, patchMap, options);
  } catch (error: any) {
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
    throw new Error(t('failedToGetGitDiff', { message: error.message }));
  }
}

export async function checkHasStagedChanges(): Promise<boolean> {
  try {
    const cwd = await getGitRepositoryRoot();
    await runGit(['diff', '--cached', '--quiet'], cwd);
    return false;
  } catch (error: any) {
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
    throw new Error(t('failedToCommit', { message: error.message }));
  }
}

async function getStagedFiles(cwd: string): Promise<GitFile[]> {
  const nameStatusOutput = await runGit(['diff', '--cached', '--name-status', '--no-renames'], cwd);
  const numStatOutput = await runGit(['diff', '--cached', '--numstat', '--no-renames'], cwd);

  return parseStagedFiles(nameStatusOutput, numStatOutput);
}

async function getStagedPatchMap(cwd: string): Promise<Map<string, string>> {
  const patchOutput = await runGit(
    ['diff', '--cached', `--unified=${DIFF_CONTEXT_LINES}`, '--no-color', '--no-renames'],
    cwd
  );

  return parsePatchMap(patchOutput);
}

async function runGit(args: string[], cwd: string): Promise<string> {
  const { stdout } = await execFileAsync('git', args, {
    cwd,
    maxBuffer: GIT_MAX_BUFFER
  });

  return stdout;
}

import * as vscode from 'vscode';

import { t } from '../i18n';

export interface GitExtensionExports {
  getAPI(version: 1): GitAPI;
}

export interface GitAPI {
  readonly repositories: GitRepository[];
}

export interface GitRepository {
  readonly rootUri: vscode.Uri;
  readonly inputBox: {
    value: string;
  };
}

let cachedGitApi: GitAPI | undefined;

/**
 * 列出 vscode.git 当前已打开的全部仓库。
 * 仅负责枚举，不做任何选择决策 —— 选择策略见 ./repositoryContext。
 */
export async function listGitRepositories(): Promise<GitRepository[]> {
  const repositories = (await getGitApi()).repositories;

  if (repositories.length === 0) {
    throw new Error(t('openGitRepository'));
  }

  return repositories;
}

async function getGitApi(): Promise<GitAPI> {
  if (cachedGitApi) {
    return cachedGitApi;
  }

  if ((vscode.workspace.workspaceFolders ?? []).length === 0) {
    throw new Error(t('openWorkspaceFolder'));
  }

  const gitExtension = vscode.extensions.getExtension<GitExtensionExports>('vscode.git');
  if (!gitExtension) {
    throw new Error(t('builtInGitUnavailable'));
  }

  cachedGitApi = (await gitExtension.activate()).getAPI(1);
  return cachedGitApi;
}

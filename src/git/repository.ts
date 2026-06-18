import * as vscode from 'vscode';

import * as path from 'path';

import { t } from '../i18n';

export interface GitExtensionExports {
  getAPI(version: 1): GitAPI;
}

export interface GitAPI {
  repositories: GitRepository[];
}

let cachedGitApi: GitAPI | undefined;

export interface GitRepository {
  rootUri: vscode.Uri;
  inputBox: {
    value: string;
  };
}

export async function getGitRepository(): Promise<GitRepository> {
  const gitApi = await getGitApi();
  const repositories = gitApi.repositories;

  if (repositories.length === 0) {
    throw new Error(t('openGitRepository'));
  }

  const activeDocumentUri = vscode.window.activeTextEditor?.document.uri;
  if (activeDocumentUri?.scheme === 'file') {
    const repositoryForDocument = findRepositoryContainingPath(
      repositories,
      activeDocumentUri.fsPath
    );

    if (repositoryForDocument) {
      return repositoryForDocument;
    }
  }

  for (const workspaceFolder of vscode.workspace.workspaceFolders ?? []) {
    const repositoryForWorkspace = findRepositoryForWorkspaceFolder(
      repositories,
      workspaceFolder.uri.fsPath
    );

    if (repositoryForWorkspace) {
      return repositoryForWorkspace;
    }
  }

  return repositories[0];
}

export async function getGitRepositoryRoot(): Promise<string> {
  return (await getGitRepository()).rootUri.fsPath;
}

export function isSamePath(left: string, right: string): boolean {
  const normalizedLeft = path.normalize(left);
  const normalizedRight = path.normalize(right);

  return process.platform === 'win32'
    ? normalizedLeft.toLowerCase() === normalizedRight.toLowerCase()
    : normalizedLeft === normalizedRight;
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

function findRepositoryContainingPath(
  repositories: GitRepository[],
  targetPath: string
): GitRepository | undefined {
  const normalizedTarget = normalizePath(targetPath);

  return [...repositories]
    .filter((repository) => isPathInside(normalizedTarget, normalizePath(repository.rootUri.fsPath)))
    .sort((left, right) => right.rootUri.fsPath.length - left.rootUri.fsPath.length)[0];
}

function findRepositoryForWorkspaceFolder(
  repositories: GitRepository[],
  workspaceFolderPath: string
): GitRepository | undefined {
  const normalizedWorkspace = normalizePath(workspaceFolderPath);
  const repositoriesInWorkspace = repositories.filter((repository) => {
    const repositoryRoot = normalizePath(repository.rootUri.fsPath);
    return isSamePath(repositoryRoot, normalizedWorkspace)
      || isPathInside(repositoryRoot, normalizedWorkspace);
  });

  if (repositoriesInWorkspace.length === 0) {
    return undefined;
  }

  return repositoriesInWorkspace.sort((left, right) => {
    const leftRoot = normalizePath(left.rootUri.fsPath);
    const rightRoot = normalizePath(right.rootUri.fsPath);
    const leftExact = isSamePath(leftRoot, normalizedWorkspace) ? 0 : 1;
    const rightExact = isSamePath(rightRoot, normalizedWorkspace) ? 0 : 1;

    if (leftExact !== rightExact) {
      return leftExact - rightExact;
    }

    return leftRoot.length - rightRoot.length;
  })[0];
}

function isPathInside(targetPath: string, parentPath: string): boolean {
  if (isSamePath(targetPath, parentPath)) {
    return true;
  }

  const normalizedTarget = normalizePath(targetPath);
  const normalizedParent = normalizePath(parentPath);
  const parentWithSeparator = normalizedParent.endsWith(path.sep)
    ? normalizedParent
    : `${normalizedParent}${path.sep}`;

  return process.platform === 'win32'
    ? normalizedTarget.toLowerCase().startsWith(parentWithSeparator.toLowerCase())
    : normalizedTarget.startsWith(parentWithSeparator);
}

function normalizePath(value: string): string {
  return path.normalize(value);
}

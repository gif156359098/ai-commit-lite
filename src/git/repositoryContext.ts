import * as path from 'path';

import * as vscode from 'vscode';

import { t } from '../i18n';
import { checkHasStagedChanges } from './diff';
import { GitRepository, listGitRepositories } from './repository';
import {
  extractRepositoryRootHint,
  findRepositoryByRoot,
  findRepositoryContainingPath,
  findRepositoryForWorkspaceFolder,
  isSamePath
} from './repositoryMatching';

/**
 * 一次解析、全链路复用的仓库上下文。
 *
 * 生成流程中的暂存检查、diff 抓取与写回输入框必须作用于同一个仓库，
 * 因此仓库只在命令入口解析一次并注入下游，而不是在每个环节各自推断。
 */
export interface GitRepositoryContext {
  /** 仓库根目录绝对路径，用作 git 子进程的 cwd */
  readonly root: string;
  /** 仓库显示名，用于日志与错误提示 */
  readonly label: string;
  /** 写回该仓库的“源代码管理”输入框 */
  setCommitInput(value: string): Promise<void>;
}

interface RepositoryCandidate {
  readonly root: string;
  readonly label: string;
  readonly repository: GitRepository;
}

export interface ResolveGitRepositoryOptions {
  /**
   * 存在歧义时是否允许弹出仓库选择器。
   * 非交互场景（如 Profile 连通性测试）应设为 false，避免打断用户。
   */
  readonly interactive?: boolean;
}

/**
 * 解析本次操作应作用的 Git 仓库。
 *
 * 优先级：
 * 1. SCM 标题栏按钮传入的 SourceControl（唯一能确定用户意图的信息源）
 * 2. 仅有一个仓库时无歧义
 * 3. 活动编辑器所属仓库（嵌套仓库取最内层）
 * 4. 仅有一个工作区文件夹时取该文件夹的首选仓库
 * 5. 仍有歧义则让用户选择
 *
 * @returns 用户在仓库选择器中取消、或非交互模式下无法消歧时返回 undefined；
 *          找不到任何仓库时抛错。
 */
export async function resolveGitRepositoryContext(
  hint?: unknown,
  options: ResolveGitRepositoryOptions = {}
): Promise<GitRepositoryContext | undefined> {
  const candidates = (await listGitRepositories()).map(toCandidate);

  const hintedRoot = extractRepositoryRootHint(hint);
  if (hintedRoot) {
    const hinted = findRepositoryByRoot(candidates, hintedRoot);
    // hint 未匹配（符号链接/junction/UNC 等路径差异）时回退到下面的消歧流程，
    // 而不是直接报错，避免合法的 SCM 按钮操作因此失败。
    if (hinted) {
      return toContext(hinted);
    }
  }

  if (candidates.length === 1) {
    return toContext(candidates[0]);
  }

  // 不限制 scheme：SCM 面板打开的 diff 视图使用 git scheme，但 fsPath 仍指向真实文件。
  // 匹配不上的虚拟文档会自然落到后续回退分支。
  const activeDocumentPath = vscode.window.activeTextEditor?.document.uri.fsPath;
  if (activeDocumentPath) {
    const containing = findRepositoryContainingPath(candidates, activeDocumentPath);
    if (containing) {
      return toContext(containing);
    }
  }

  const workspaceFolders = vscode.workspace.workspaceFolders ?? [];
  if (workspaceFolders.length === 1) {
    const withinWorkspace = findRepositoryForWorkspaceFolder(
      candidates,
      workspaceFolders[0].uri.fsPath
    );

    if (withinWorkspace) {
      return toContext(withinWorkspace);
    }
  }

  if (options.interactive === false) {
    return undefined;
  }

  const picked = await pickRepository(candidates);
  return picked ? toContext(picked) : undefined;
}

interface RepositoryQuickPickItem extends vscode.QuickPickItem {
  readonly candidate: RepositoryCandidate;
}

async function pickRepository(
  candidates: RepositoryCandidate[]
): Promise<RepositoryCandidate | undefined> {
  const items = await Promise.all(candidates.map(toQuickPickItem));

  // 有暂存变更的仓库排在前面：多仓库场景下用户要生成的几乎总是刚暂存过的那个。
  const sortedItems = [...items].sort((left, right) => {
    if (left.hasStagedChanges !== right.hasStagedChanges) {
      return left.hasStagedChanges ? -1 : 1;
    }

    return left.label.localeCompare(right.label);
  });

  const selection = await vscode.window.showQuickPick<RepositoryQuickPickItem>(sortedItems, {
    placeHolder: t('selectGitRepository'),
    matchOnDescription: true
  });

  return selection?.candidate;
}

async function toQuickPickItem(
  candidate: RepositoryCandidate
): Promise<RepositoryQuickPickItem & { hasStagedChanges: boolean }> {
  const hasStagedChanges = await hasStagedChangesSafely(candidate.root);

  return {
    candidate,
    hasStagedChanges,
    label: candidate.label,
    description: candidate.root,
    detail: hasStagedChanges ? t('repositoryHasStagedChanges') : t('repositoryNoStagedChanges')
  };
}

/**
 * 选择器里的暂存状态只是辅助信息，单个仓库探测失败不应阻断整个选择流程。
 */
async function hasStagedChangesSafely(repositoryRoot: string): Promise<boolean> {
  try {
    return await checkHasStagedChanges(repositoryRoot);
  } catch {
    return false;
  }
}

function toCandidate(repository: GitRepository): RepositoryCandidate {
  const root = repository.rootUri.fsPath;

  return {
    repository,
    root,
    label: path.basename(root) || root
  };
}

function toContext(candidate: RepositoryCandidate): GitRepositoryContext {
  return {
    root: candidate.root,
    label: candidate.label,
    setCommitInput: async (value: string): Promise<void> => {
      // 生成期间仓库可能被关闭、重命名或重新打开，vscode.git 的运行时对象会失效；
      // 写回时按 root 从最新仓库列表中重新查找，避免写入陈旧对象。
      const repositories = await listGitRepositories();
      const current = repositories.find((repository) =>
        isSamePath(repository.rootUri.fsPath, candidate.root)
      );

      if (!current) {
        throw new Error(t('repositoryNotFoundInSourceControl'));
      }

      current.inputBox.value = value;
    }
  };
}

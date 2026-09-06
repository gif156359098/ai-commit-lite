import * as path from 'path';

/**
 * 参与路径匹配的最小仓库形状。
 * 刻意不依赖 vscode 类型，使匹配逻辑可在无 vscode 运行时的测试中直接覆盖。
 */
export interface RepositoryLike {
  readonly root: string;
}

/** 仓库根提示的来源：决定其权威性 */
export type RepositoryHintSource = 'source-control' | 'uri' | 'path-string';

/** 从命令实参中提取到的仓库根路径提示及其来源 */
export interface RepositoryRootHint {
  readonly root: string;
  readonly source: RepositoryHintSource;
}

/**
 * 从命令实参中提取仓库根路径提示。
 *
 * VS Code 在点击 `scm/title` 菜单按钮时，会把该分组对应的 SourceControl 对象
 * 作为第一个实参传入命令。这是唯一能确定「用户点的是哪个仓库」的信息来源，
 * 其余入口（命令面板、快捷键）不携带实参，返回 undefined 由调用方回退。
 *
 * 采用结构化判断而非 instanceof，以同时兼容 SourceControl、Uri 与纯路径字符串。
 * 返回来源标签：调用方必须区分「用户明确点击的仓库」（匹配失败时应让用户确认，
 * 绝不能静默推断）与「内部重试传入的根路径字符串」（可安全回退）。
 */
export function extractRepositoryRootHint(hint: unknown): RepositoryRootHint | undefined {
  if (typeof hint === 'string') {
    const root = hint.trim();
    return root.length > 0 ? { root, source: 'path-string' } : undefined;
  }

  if (typeof hint !== 'object' || hint === null) {
    return undefined;
  }

  // SourceControl / ApiRepository：{ rootUri: Uri }
  const rootUri = (hint as { rootUri?: unknown }).rootUri;
  const rootUriPath = readFsPath(rootUri);
  if (rootUriPath) {
    return { root: rootUriPath, source: 'source-control' };
  }

  // Uri：{ fsPath: string }
  const uriPath = readFsPath(hint);
  if (uriPath) {
    return { root: uriPath, source: 'uri' };
  }

  return undefined;
}

export function isSamePath(left: string, right: string): boolean {
  const normalizedLeft = path.normalize(left);
  const normalizedRight = path.normalize(right);

  return process.platform === 'win32'
    ? normalizedLeft.toLowerCase() === normalizedRight.toLowerCase()
    : normalizedLeft === normalizedRight;
}

export function isPathInside(targetPath: string, parentPath: string): boolean {
  if (isSamePath(targetPath, parentPath)) {
    return true;
  }

  const normalizedTarget = path.normalize(targetPath);
  const normalizedParent = path.normalize(parentPath);
  const parentWithSeparator = normalizedParent.endsWith(path.sep)
    ? normalizedParent
    : `${normalizedParent}${path.sep}`;

  return process.platform === 'win32'
    ? normalizedTarget.toLowerCase().startsWith(parentWithSeparator.toLowerCase())
    : normalizedTarget.startsWith(parentWithSeparator);
}

/**
 * 按仓库根目录精确匹配。用于消费 SourceControl 提示，要求完全一致以避免误选。
 */
export function findRepositoryByRoot<T extends RepositoryLike>(
  repositories: readonly T[],
  root: string
): T | undefined {
  return repositories.find((repository) => isSamePath(repository.root, root));
}

/**
 * 查找包含目标路径的仓库。嵌套仓库/子模块场景取最内层（根路径最长）。
 */
export function findRepositoryContainingPath<T extends RepositoryLike>(
  repositories: readonly T[],
  targetPath: string
): T | undefined {
  return [...repositories]
    .filter((repository) => isPathInside(targetPath, repository.root))
    .sort((left, right) => right.root.length - left.root.length)[0];
}

/**
 * 查找归属于指定工作区文件夹的仓库。优先与文件夹根完全一致，其次取最外层。
 */
export function findRepositoryForWorkspaceFolder<T extends RepositoryLike>(
  repositories: readonly T[],
  workspaceFolderPath: string
): T | undefined {
  const repositoriesInWorkspace = repositories.filter((repository) =>
    isPathInside(repository.root, workspaceFolderPath)
  );

  if (repositoriesInWorkspace.length === 0) {
    return undefined;
  }

  return [...repositoriesInWorkspace].sort((left, right) => {
    const leftExact = isSamePath(left.root, workspaceFolderPath) ? 0 : 1;
    const rightExact = isSamePath(right.root, workspaceFolderPath) ? 0 : 1;

    if (leftExact !== rightExact) {
      return leftExact - rightExact;
    }

    return left.root.length - right.root.length;
  })[0];
}

function readFsPath(value: unknown): string | undefined {
  if (typeof value !== 'object' || value === null) {
    return undefined;
  }

  const fsPath = (value as { fsPath?: unknown }).fsPath;
  return typeof fsPath === 'string' && fsPath.trim().length > 0 ? fsPath : undefined;
}

export type RepositorySelectionDecision =
  | { readonly kind: 'select'; readonly root: string }
  | { readonly kind: 'picker' }
  | { readonly kind: 'none' };

export interface RepositorySelectionInput<T extends RepositoryLike> {
  readonly candidates: readonly T[];
  readonly hint?: RepositoryRootHint;
  readonly activeDocumentPath?: string;
  readonly workspaceFolderPaths: readonly string[];
  /** true = 允许弹出仓库选择器；false = 非交互（如连通性测试） */
  readonly interactive: boolean;
}

/**
 * 纯函数：决定仓库解析的下一步动作。
 *
 * 规则（优先级从高到低）：
 * 1. hinit 命中的仓库；
 * 2. 「用户显式提示」（SourceControl / Uri）未命中时直接让用户确认（picker/none），
 *    绝不静默推断到其他仓库 —— 提交信息写错仓库比一次额外点击严重得多；
 * 3. 仅有一个仓库；
 * 4. 活动编辑器所在仓库（嵌套仓库取最内层）；
 * 5. 仅有一个工作区文件夹时取该文件夹首选仓库；
 * 6. 仍有歧义时交互模式弹选择器，非交互模式返回 none。
 */
export function decideRepositorySelection<T extends RepositoryLike>(
  input: RepositorySelectionInput<T>
): RepositorySelectionDecision {
  const { candidates, hint, activeDocumentPath, workspaceFolderPaths, interactive } = input;

  if (hint) {
    const hinted = findRepositoryByRoot(candidates, hint.root);
    if (hinted) {
      return { kind: 'select', root: hinted.root };
    }

    if (hint.source !== 'path-string') {
      return interactive ? { kind: 'picker' } : { kind: 'none' };
    }
  }

  if (candidates.length === 1) {
    return { kind: 'select', root: candidates[0].root };
  }

  if (activeDocumentPath && activeDocumentPath.trim().length > 0) {
    const containing = findRepositoryContainingPath(candidates, activeDocumentPath);
    if (containing) {
      return { kind: 'select', root: containing.root };
    }
  }

  const workspacePaths = workspaceFolderPaths.filter((p) => p.trim().length > 0);
  if (workspacePaths.length === 1) {
    const within = findRepositoryForWorkspaceFolder(candidates, workspacePaths[0]);
    if (within) {
      return { kind: 'select', root: within.root };
    }
  }

  return interactive ? { kind: 'picker' } : { kind: 'none' };
}

import * as path from 'path';

/**
 * 参与路径匹配的最小仓库形状。
 * 刻意不依赖 vscode 类型，使匹配逻辑可在无 vscode 运行时的测试中直接覆盖。
 */
export interface RepositoryLike {
  readonly root: string;
}

/**
 * 从命令实参中提取仓库根路径提示。
 *
 * VS Code 在点击 `scm/title` 菜单按钮时，会把该分组对应的 SourceControl 对象
 * 作为第一个实参传入命令。这是唯一能确定「用户点的是哪个仓库」的信息来源，
 * 其余入口（命令面板、快捷键）不携带实参，返回 undefined 由调用方回退。
 *
 * 采用结构化判断而非 instanceof，以同时兼容 SourceControl、Uri 与纯路径字符串。
 */
export function extractRepositoryRootHint(hint: unknown): string | undefined {
  if (typeof hint === 'string') {
    return hint.trim().length > 0 ? hint : undefined;
  }

  if (typeof hint !== 'object' || hint === null) {
    return undefined;
  }

  // SourceControl / ApiRepository：{ rootUri: Uri }
  const rootUri = (hint as { rootUri?: unknown }).rootUri;
  const rootUriPath = readFsPath(rootUri);
  if (rootUriPath) {
    return rootUriPath;
  }

  // Uri：{ fsPath: string }
  return readFsPath(hint);
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

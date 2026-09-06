import assert from 'node:assert/strict';
import * as path from 'node:path';
import { test } from 'node:test';

import {
  extractRepositoryRootHint,
  findRepositoryByRoot,
  findRepositoryContainingPath,
  findRepositoryForWorkspaceFolder,
  isPathInside,
  isSamePath
} from '../../src/git/repositoryMatching';

const WORKSPACE = path.join(path.sep, 'workspace');
const OUTER = path.join(WORKSPACE, 'outer');
const INNER = path.join(OUTER, 'vendor', 'inner');
const SIBLING = path.join(WORKSPACE, 'sibling');

const REPOSITORIES = [
  { root: OUTER },
  { root: INNER },
  { root: SIBLING }
];

test('isSamePath normalizes redundant segments', () => {
  assert.equal(isSamePath(OUTER, path.join(OUTER, '.', '')), true);
  assert.equal(isSamePath(OUTER, path.join(OUTER, 'nested', '..')), true);
  assert.equal(isSamePath(OUTER, SIBLING), false);
});

test('isPathInside treats identical paths as inside but rejects sibling prefixes', () => {
  assert.equal(isPathInside(OUTER, OUTER), true);
  assert.equal(isPathInside(path.join(OUTER, 'src', 'index.ts'), OUTER), true);
  // "outer-extra" 与 "outer" 共享前缀但不是子路径，必须靠分隔符区分
  assert.equal(isPathInside(`${OUTER}-extra`, OUTER), false);
  assert.equal(isPathInside(SIBLING, OUTER), false);
});

test('findRepositoryByRoot matches only on exact root', () => {
  assert.equal(findRepositoryByRoot(REPOSITORIES, INNER)?.root, INNER);
  assert.equal(findRepositoryByRoot(REPOSITORIES, path.join(INNER, 'src')), undefined);
  assert.equal(findRepositoryByRoot(REPOSITORIES, path.join(WORKSPACE, 'unknown')), undefined);
});

test('findRepositoryContainingPath prefers the innermost nested repository', () => {
  const filePath = path.join(INNER, 'src', 'index.ts');
  assert.equal(findRepositoryContainingPath(REPOSITORIES, filePath)?.root, INNER);

  const outerFilePath = path.join(OUTER, 'src', 'index.ts');
  assert.equal(findRepositoryContainingPath(REPOSITORIES, outerFilePath)?.root, OUTER);

  assert.equal(
    findRepositoryContainingPath(REPOSITORIES, path.join(WORKSPACE, 'elsewhere', 'a.ts')),
    undefined
  );
});

test('findRepositoryForWorkspaceFolder prefers an exact match, then the outermost repository', () => {
  // 工作区文件夹自身就是仓库根时精确命中
  assert.equal(findRepositoryForWorkspaceFolder(REPOSITORIES, OUTER)?.root, OUTER);
  // 工作区文件夹包含多个仓库时取最外层，避免误选子模块
  assert.equal(findRepositoryForWorkspaceFolder(REPOSITORIES, WORKSPACE)?.root, OUTER);
  assert.equal(
    findRepositoryForWorkspaceFolder(REPOSITORIES, path.join(path.sep, 'other')),
    undefined
  );
});

test('extractRepositoryRootHint reads the SourceControl passed by the SCM title button', () => {
  const sourceControl = { id: 'git', label: 'Git', rootUri: { fsPath: SIBLING } };
  assert.deepEqual(extractRepositoryRootHint(sourceControl), {
    root: SIBLING,
    source: 'source-control'
  });
});

test('extractRepositoryRootHint accepts a Uri-like value or a plain path', () => {
  assert.deepEqual(extractRepositoryRootHint({ fsPath: OUTER }), {
    root: OUTER,
    source: 'uri'
  });
  assert.deepEqual(extractRepositoryRootHint(OUTER), {
    root: OUTER,
    source: 'path-string'
  });
});

test('extractRepositoryRootHint trims whitespace from string hints', () => {
  assert.deepEqual(extractRepositoryRootHint(`  ${SIBLING}  `), {
    root: SIBLING,
    source: 'path-string'
  });
});

test('extractRepositoryRootHint ignores argument shapes that carry no repository root', () => {
  // 命令面板与快捷键入口不传实参，必须回退而不是误判
  assert.equal(extractRepositoryRootHint(undefined), undefined);
  assert.equal(extractRepositoryRootHint(null), undefined);
  assert.equal(extractRepositoryRootHint(''), undefined);
  assert.equal(extractRepositoryRootHint('   '), undefined);
  assert.equal(extractRepositoryRootHint(42), undefined);
  assert.equal(extractRepositoryRootHint({}), undefined);
  assert.equal(extractRepositoryRootHint({ rootUri: undefined }), undefined);
  assert.equal(extractRepositoryRootHint({ rootUri: { fsPath: '' } }), undefined);
});

import assert from 'node:assert/strict';
import * as path from 'node:path';
import { test } from 'node:test';

import {
  decideRepositorySelection,
  RepositoryLike,
  RepositoryRootHint
} from '../../src/git/repositoryMatching';

const WORKSPACE = path.join(path.sep, 'workspace');
const OUTER = path.join(WORKSPACE, 'outer');
const INNER = path.join(OUTER, 'vendor', 'inner');
const SIBLING = path.join(WORKSPACE, 'sibling');

const CANDIDATES: RepositoryLike[] = [
  { root: OUTER },
  { root: INNER },
  { root: SIBLING }
];

function pickerOrNone(interactive: boolean) {
  return {
    candidates: CANDIDATES,
    hint: undefined,
    activeDocumentPath: undefined,
    workspaceFolderPaths: [],
    interactive
  };
}

test('decideRepositorySelection selects the hinted repository when it matches', () => {
  const hint: RepositoryRootHint = { root: SIBLING, source: 'source-control' };
  assert.deepEqual(
    decideRepositorySelection({ ...pickerOrNone(true), hint }),
    { kind: 'select', root: SIBLING }
  );
});

test('decideRepositorySelection never silently falls back after an explicit hint miss', () => {
  const missingHint: RepositoryRootHint = { root: path.join(path.sep, 'other'), source: 'source-control' };
  // 即使只剩一个候选，也必须让用户确认（选择器在交互模式）
  assert.equal(
    decideRepositorySelection({
      candidates: [{ root: OUTER }],
      hint: missingHint,
      activeDocumentPath: undefined,
      workspaceFolderPaths: [],
      interactive: true
    }).kind,
    'picker'
  );
  assert.equal(
    decideRepositorySelection({
      candidates: [{ root: OUTER }],
      hint: missingHint,
      activeDocumentPath: undefined,
      workspaceFolderPaths: [],
      interactive: false
    }).kind,
    'none'
  );
});

test('decideRepositorySelection treats Uri hints as explicit user intent too', () => {
  const uriHint: RepositoryRootHint = { root: path.join(path.sep, 'other'), source: 'uri' };
  assert.equal(
    decideRepositorySelection({ ...pickerOrNone(true), hint: uriHint }).kind,
    'picker'
  );
});

test('decideRepositorySelection allows string hints to fall back to disambiguation', () => {
  const stringHint: RepositoryRootHint = { root: path.join(path.sep, 'other'), source: 'path-string' };
  // 唯一候选：直接选中
  assert.deepEqual(
    decideRepositorySelection({
      candidates: [{ root: OUTER }],
      hint: stringHint,
      activeDocumentPath: undefined,
      workspaceFolderPaths: [],
      interactive: true
    }),
    { kind: 'select', root: OUTER }
  );
  // 多候选 + 活动编辑器命中：选中内层仓库
  assert.deepEqual(
    decideRepositorySelection({
      candidates: CANDIDATES,
      hint: stringHint,
      activeDocumentPath: path.join(INNER, 'src', 'index.ts'),
      workspaceFolderPaths: [],
      interactive: true
    }),
    { kind: 'select', root: INNER }
  );
});

test('decideRepositorySelection selects the only candidate without any hint', () => {
  assert.deepEqual(
    decideRepositorySelection({
      candidates: [{ root: OUTER }],
      hint: undefined,
      activeDocumentPath: undefined,
      workspaceFolderPaths: [],
      interactive: true
    }),
    { kind: 'select', root: OUTER }
  );
});

test('decideRepositorySelection prefers the innermost repository containing the active document', () => {
  assert.deepEqual(
    decideRepositorySelection({
      candidates: CANDIDATES,
      hint: undefined,
      activeDocumentPath: path.join(INNER, 'src', 'index.ts'),
      workspaceFolderPaths: [],
      interactive: true
    }),
    { kind: 'select', root: INNER }
  );
});

test('decideRepositorySelection falls back to the workspace folder when no document match exists', () => {
  assert.deepEqual(
    decideRepositorySelection({
      candidates: CANDIDATES,
      hint: undefined,
      activeDocumentPath: path.join(WORKSPACE, 'elsewhere', 'a.ts'),
      workspaceFolderPaths: [WORKSPACE],
      interactive: true
    }),
    { kind: 'select', root: OUTER }
  );
});

test('decideRepositorySelection ignores blank active document paths and asks for confirmation', () => {
  assert.deepEqual(
    decideRepositorySelection({
      candidates: CANDIDATES,
      hint: undefined,
      activeDocumentPath: '   ',
      workspaceFolderPaths: [],
      interactive: true
    }),
    { kind: 'picker' }
  );
});

test('decideRepositorySelection returns picker only in interactive mode', () => {
  assert.deepEqual(decideRepositorySelection(pickerOrNone(true)), { kind: 'picker' });
  assert.equal(decideRepositorySelection(pickerOrNone(false)).kind, 'none');
});

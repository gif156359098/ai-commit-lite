import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildPreparedDiffContext,
  generateSummary,
  getFilePriority
} from '../../src/git/diffContextBuilder';
import { GitFile } from '../../src/git/diffTypes';

function createFile(
  path: string,
  additions: number,
  deletions: number,
  overrides: Partial<GitFile> = {}
): GitFile {
  return {
    status: 'M',
    path,
    additions,
    deletions,
    changes: '',
    isBinary: false,
    ...overrides
  };
}

test('getFilePriority keeps source files ahead of config, docs, tests, and assets', () => {
  assert.deepEqual(
    [
      getFilePriority('src/app.ts'),
      getFilePriority('package.json'),
      getFilePriority('docs/readme.md'),
      getFilePriority('src/app.test.ts'),
      getFilePriority('assets/logo.svg')
    ],
    [0, 1, 2, 3, 4]
  );
});

test('generateSummary includes binary file count when present', () => {
  const summary = generateSummary([
    createFile('src/app.ts', 10, 2),
    createFile('assets/logo.png', 0, 0, { isBinary: true })
  ]);

  assert.equal(summary, '2 file(s) changed, 10 insertion(s), 2 deletion(s), 1 binary file(s)');
});

test('buildPreparedDiffContext tracks filtered, truncated, and summarized files', () => {
  const files = [
    createFile('src/a.ts', 10, 1),
    createFile('package-lock.json', 25, 10),
    createFile('src/b.ts', 20, 5),
    createFile('src/c.ts', 5, 2)
  ];
  const patchMap = new Map<string, string>([
    ['src/a.ts', 'a'.repeat(150)],
    ['src/b.ts', 'b'.repeat(150)],
    ['src/c.ts', 'c'.repeat(60)]
  ]);

  const preparedDiff = buildPreparedDiffContext(files, patchMap, {
    excludePatterns: ['**/package-lock.json'],
    maxDiffCharacters: 1000,
    maxFileDiffCharacters: 120
  });

  assert.deepEqual(preparedDiff.report.includedFiles, ['src/a.ts', 'src/b.ts']);
  assert.deepEqual(preparedDiff.report.filteredFiles, [
    { file: 'package-lock.json', reason: 'filtered by contextExcludePatterns' }
  ]);
  assert.deepEqual(preparedDiff.report.truncatedFiles, ['src/a.ts', 'src/b.ts']);
  assert.deepEqual(preparedDiff.report.summarizedFiles, ['src/c.ts']);
  assert.match(preparedDiff.prompt, /summary only: filtered by contextExcludePatterns/);
  assert.match(preparedDiff.prompt, /summary only: omitted because the total AI context limit was reached/);
  assert.match(preparedDiff.raw, /diff truncated to fit the per-file AI context limit/);
});
import assert from 'node:assert/strict';
import test from 'node:test';
import { parsePatchMap, parseStagedFiles } from '../../src/git/diffParsing';

test('parseStagedFiles merges name-status and numstat output including binary files', () => {
  const files = parseStagedFiles(
    ['M\tsrc/app.ts', 'A\tassets/logo.png', 'D\tdocs/readme.md'].join('\n'),
    ['12\t3\tsrc/app.ts', '-\t-\tassets/logo.png', '0\t7\tdocs/readme.md'].join('\n')
  );

  assert.deepEqual(
    files.map((file) => ({
      status: file.status,
      path: file.path,
      additions: file.additions,
      deletions: file.deletions,
      isBinary: file.isBinary
    })),
    [
      { status: 'M', path: 'src/app.ts', additions: 12, deletions: 3, isBinary: false },
      { status: 'A', path: 'assets/logo.png', additions: 0, deletions: 0, isBinary: true },
      { status: 'D', path: 'docs/readme.md', additions: 0, deletions: 7, isBinary: false }
    ]
  );
});

test('parsePatchMap extracts normalized paths from quoted and deleted file patches', () => {
  const patchMap = parsePatchMap([
    'diff --git a/src/app.ts b/src/app.ts',
    '--- a/src/app.ts',
    '+++ b/src/app.ts',
    '@@ -1 +1 @@',
    '+console.log("app")',
    '',
    'diff --git a/"docs/hello world.md" b/"docs/hello world.md"',
    'new file mode 100644',
    '--- /dev/null',
    '+++ b/"docs/hello world.md"',
    '@@ -0,0 +1 @@',
    '+hello',
    '',
    'diff --git a/src/obsolete.ts b/src/obsolete.ts',
    '--- a/src/obsolete.ts',
    '+++ /dev/null',
    '@@ -1 +0,0 @@',
    '-old'
  ].join('\n'));

  assert.equal(patchMap.get('src/app.ts')?.includes('console.log'), true);
  assert.equal(patchMap.get('docs/hello world.md')?.includes('+hello'), true);
  assert.equal(patchMap.get('src/obsolete.ts')?.includes('-old'), true);
});

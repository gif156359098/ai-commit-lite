import assert from 'node:assert/strict';
import test from 'node:test';
import { parseStagedFiles } from '../../src/git/diffParsing';

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


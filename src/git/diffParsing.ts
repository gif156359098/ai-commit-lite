import { GitFile } from './diffTypes';

export function parseStagedFiles(nameStatusOutput: string, numStatOutput: string): GitFile[] {
  const numStatMap = new Map<string, { additions: number; deletions: number; isBinary: boolean }>();
  const files: GitFile[] = [];

  for (const line of numStatOutput.trim().split('\n')) {
    if (!line.trim()) {
      continue;
    }

    const [additionsRaw, deletionsRaw, ...pathParts] = line.split('\t');
    const path = pathParts.join('\t').trim();

    if (!path) {
      continue;
    }

    const isBinary = additionsRaw === '-' || deletionsRaw === '-';
    numStatMap.set(path, {
      additions: isBinary ? 0 : Number(additionsRaw),
      deletions: isBinary ? 0 : Number(deletionsRaw),
      isBinary
    });
  }

  for (const line of nameStatusOutput.trim().split('\n')) {
    if (!line.trim()) {
      continue;
    }

    const [statusRaw, ...pathParts] = line.split('\t');
    const status = statusRaw.trim().charAt(0) || 'M';
    const path = pathParts[pathParts.length - 1]?.trim();

    if (!path) {
      continue;
    }

    const stats = numStatMap.get(path) ?? {
      additions: 0,
      deletions: 0,
      isBinary: false
    };

    files.push({
      status,
      path,
      additions: stats.additions,
      deletions: stats.deletions,
      changes: '',
      isBinary: stats.isBinary
    });
  }

  return files;
}

export function parsePatchMap(patchOutput: string): Map<string, string> {
  const patchMap = new Map<string, string>();
  const lines = patchOutput.replace(/\r\n/g, '\n').split('\n');
  let currentSegment: string[] = [];

  const flushSegment = (): void => {
    if (currentSegment.length === 0) {
      return;
    }

    const filePath = getPatchFilePath(currentSegment);
    if (filePath) {
      patchMap.set(filePath, currentSegment.join('\n').trim());
    }

    currentSegment = [];
  };

  for (const line of lines) {
    if (line.startsWith('diff --git ')) {
      flushSegment();
    }

    if (line.length > 0 || currentSegment.length > 0) {
      currentSegment.push(line);
    }
  }

  flushSegment();

  return patchMap;
}

function getPatchFilePath(segmentLines: string[]): string | null {
  for (const line of segmentLines) {
    if (line.startsWith('+++ b/')) {
      return normalizePatchPath(line.slice('+++ b/'.length));
    }

    if (line.startsWith('--- a/')) {
      return normalizePatchPath(line.slice('--- a/'.length));
    }
  }

  const header = segmentLines[0];
  if (!header?.startsWith('diff --git a/')) {
    return null;
  }

  const payload = header.slice('diff --git a/'.length);
  const separatorIndex = payload.lastIndexOf(' b/');
  if (separatorIndex === -1) {
    return null;
  }

  return normalizePatchPath(payload.slice(separatorIndex + 3));
}

function normalizePatchPath(filePath: string): string | null {
  const trimmedPath = filePath.trim();

  if (!trimmedPath || trimmedPath === '/dev/null') {
    return null;
  }

  return trimmedPath.replace(/^"/, '').replace(/"$/, '').replace(/\\(["\\])/g, '$1');
}

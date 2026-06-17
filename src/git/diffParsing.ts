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


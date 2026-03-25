export function matchesAnyGlob(path: string, patterns: string[]): boolean {
  return patterns.some((pattern) => matchesGlob(path, pattern));
}

export function matchesGlob(path: string, pattern: string): boolean {
  const normalizedPath = normalizeSegments(path);
  const normalizedPattern = normalizeSegments(pattern);

  return matchSegments(normalizedPath, normalizedPattern, 0, 0);
}

function matchSegments(
  pathSegments: string[],
  patternSegments: string[],
  pathIndex: number,
  patternIndex: number
): boolean {
  if (patternIndex === patternSegments.length) {
    return pathIndex === pathSegments.length;
  }

  const patternSegment = patternSegments[patternIndex];

  if (patternSegment === '**') {
    if (patternIndex === patternSegments.length - 1) {
      return true;
    }

    for (let index = pathIndex; index <= pathSegments.length; index += 1) {
      if (matchSegments(pathSegments, patternSegments, index, patternIndex + 1)) {
        return true;
      }
    }

    return false;
  }

  if (pathIndex >= pathSegments.length) {
    return false;
  }

  if (!matchSegment(pathSegments[pathIndex], patternSegment)) {
    return false;
  }

  return matchSegments(pathSegments, patternSegments, pathIndex + 1, patternIndex + 1);
}

function matchSegment(text: string, pattern: string): boolean {
  const regex = new RegExp(`^${escapeRegExp(pattern).replace(/\\\*/g, '[^/]*').replace(/\\\?/g, '[^/]')}$`, 'i');
  return regex.test(text);
}

function normalizeSegments(value: string): string[] {
  const normalized = value.replace(/\\/g, '/').replace(/^\.\/+/, '').replace(/\/+/g, '/').trim();

  if (!normalized) {
    return [];
  }

  return normalized.split('/').filter((segment) => segment.length > 0);
}

function escapeRegExp(value: string): string {
  return value.replace(/[|\\{}()[\]^$+*?.]/g, '\\$&');
}

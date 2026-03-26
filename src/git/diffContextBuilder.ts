import { matchesAnyGlob } from '../utils/glob';
import {
  DiffContextOptions,
  DiffContextReport,
  GitFile,
  PreparedGitDiff
} from './diffTypes';

const MIN_REMAINING_DIFF_CHARACTERS = 800;
const MAX_FILE_SUMMARY_LINES = 80;
const MAX_SUMMARIZED_ENTRY_LINES = 50;
const TRUNCATED_PATCH_SUFFIX = '\n... diff truncated to fit the per-file AI context limit ...';

interface FileContextEntry {
  file: GitFile;
  note?: string;
  patch?: string;
}

export function buildPreparedDiffContext(
  files: GitFile[],
  patchMap: ReadonlyMap<string, string>,
  options: DiffContextOptions
): PreparedGitDiff {
  const summary = generateSummary(files);
  const report: DiffContextReport = {
    totalFiles: files.length,
    includedFiles: [],
    filteredFiles: [],
    truncatedFiles: [],
    summarizedFiles: [],
    totalPromptCharacters: 0
  };

  const orderedFiles = prioritizeFiles(files);
  const includedEntries: FileContextEntry[] = [];
  const filteredEntries: FileContextEntry[] = [];
  const summarizedEntries: FileContextEntry[] = [];
  let totalDiffCharacters = 0;

  for (const file of orderedFiles) {
    if (matchesAnyGlob(file.path, options.excludePatterns)) {
      const reason = 'filtered by contextExcludePatterns';
      report.filteredFiles.push({ file: file.path, reason });
      filteredEntries.push({
        file,
        note: `summary only: ${reason}`
      });
      continue;
    }

    const patch = (patchMap.get(file.path) || '').trim();

    if (!patch) {
      report.summarizedFiles.push(file.path);
      summarizedEntries.push({
        file,
        note: 'summary only: patch content not available'
      });
      continue;
    }

    let preparedPatch = patch;
    let truncated = false;

    if (preparedPatch.length > options.maxFileDiffCharacters) {
      preparedPatch = truncatePatch(preparedPatch, options.maxFileDiffCharacters);
      truncated = true;
      report.truncatedFiles.push(file.path);
    }

    const remainingCharacters = options.maxDiffCharacters - totalDiffCharacters;
    if (remainingCharacters < MIN_REMAINING_DIFF_CHARACTERS || preparedPatch.length > remainingCharacters) {
      report.summarizedFiles.push(file.path);
      summarizedEntries.push({
        file,
        note: 'summary only: omitted because the total AI context limit was reached'
      });
      continue;
    }

    totalDiffCharacters += preparedPatch.length;
    report.includedFiles.push(file.path);
    includedEntries.push({
      file,
      patch: preparedPatch,
      note: truncated ? 'diff truncated to fit the per-file context limit' : undefined
    });
  }

  const prompt = buildPrompt(
    summary,
    files,
    includedEntries,
    [...filteredEntries, ...summarizedEntries]
  );
  report.totalPromptCharacters = prompt.length;

  return {
    raw: includedEntries.map((entry) => entry.patch).filter(Boolean).join('\n\n'),
    files,
    summary,
    prompt,
    report
  };
}

export function prioritizeFiles(files: GitFile[]): GitFile[] {
  return [...files].sort((left, right) => {
    const priorityDifference = getFilePriority(left.path) - getFilePriority(right.path);

    if (priorityDifference !== 0) {
      return priorityDifference;
    }

    return left.path.localeCompare(right.path);
  });
}

export function getFilePriority(filePath: string): number {
  const normalizedPath = filePath.toLowerCase();
  const isTestPath = /(^|\/)(test|tests|spec|specs)(\/|$)/.test(normalizedPath)
    || /\.(test|spec)\.[^/.]+$/.test(normalizedPath);

  if (isTestPath) {
    return 3;
  }

  if (/\.(ts|tsx|js|jsx|vue|svelte|astro|py|java|kt|kts|go|rs|php|rb|swift|c|cc|cpp|h|hpp|cs|scala)$/.test(normalizedPath)) {
    return 0;
  }

  if (/\.(json|ya?ml|toml|xml|ini|conf|config|gradle|props|targets)$/.test(normalizedPath)) {
    return 1;
  }

  if (/\.(md|mdx|txt|rst)$/.test(normalizedPath) || normalizedPath.includes('/docs/')) {
    return 2;
  }

  return 4;
}

export function truncatePatch(patch: string, maxCharacters: number): string {
  if (patch.length <= maxCharacters) {
    return patch;
  }

  return `${patch.slice(0, Math.max(0, maxCharacters - TRUNCATED_PATCH_SUFFIX.length)).trimEnd()}${TRUNCATED_PATCH_SUFFIX}`;
}

export function generateSummary(files: GitFile[]): string {
  if (files.length === 0) {
    return 'No changes';
  }

  const totalAdditions = files.reduce((sum, file) => sum + file.additions, 0);
  const totalDeletions = files.reduce((sum, file) => sum + file.deletions, 0);
  const binaryFiles = files.filter((file) => file.isBinary).length;
  const binarySuffix = binaryFiles > 0 ? `, ${binaryFiles} binary file(s)` : '';

  return `${files.length} file(s) changed, ${totalAdditions} insertion(s), ${totalDeletions} deletion(s)${binarySuffix}`;
}

function buildPrompt(
  summary: string,
  files: GitFile[],
  includedEntries: FileContextEntry[],
  summarizedEntries: FileContextEntry[]
): string {
  const summarizedNotes = new Map<string, string>();

  for (const entry of summarizedEntries) {
    if (entry.note) {
      summarizedNotes.set(entry.file.path, entry.note);
    }
  }

  for (const entry of includedEntries) {
    if (entry.note) {
      summarizedNotes.set(entry.file.path, entry.note);
    }
  }

  const sections: string[] = [
    'Staged changes overview:',
    `- ${summary}`,
    '',
    'Staged files:'
  ];

  for (const file of files) {
    const note = summarizedNotes.get(file.path);
    sections.push(`- ${formatFileSummary(file)}${note ? ` [${note}]` : ''}`);
  }

  compactSection(sections, 'Staged files:', MAX_FILE_SUMMARY_LINES);

  if (includedEntries.length > 0) {
    sections.push('', 'Included patch details:');
    for (const entry of includedEntries) {
      if (entry.note) {
        sections.push('', `# ${entry.file.path} (${entry.note})`, entry.patch ?? '');
      } else {
        sections.push('', `# ${entry.file.path}`, entry.patch ?? '');
      }
    }
  } else {
    sections.push(
      '',
      'No raw patch content was included because all staged files matched filters or exceeded the context limits.',
      'Use the staged file summary above to infer the commit intent.'
    );
  }

  if (summarizedEntries.length > 0) {
    sections.push('', 'Files summarized without full patch content:');
    for (const entry of summarizedEntries) {
      sections.push(`- ${formatFileSummary(entry.file)} [${entry.note}]`);
    }

    compactSection(
      sections,
      'Files summarized without full patch content:',
      MAX_SUMMARIZED_ENTRY_LINES
    );
  }

  return sections.join('\n').trim();
}

function formatFileSummary(file: GitFile): string {
  const stats = file.isBinary
    ? 'binary'
    : `+${file.additions} -${file.deletions}`;

  return `${file.status} ${file.path} (${stats})`;
}

function compactSection(lines: string[], sectionTitle: string, maxItems: number): void {
  const sectionIndex = lines.indexOf(sectionTitle);

  if (sectionIndex === -1) {
    return;
  }

  const startIndex = sectionIndex + 1;
  let endIndex = lines.length;

  for (let index = startIndex; index < lines.length; index += 1) {
    if (lines[index] === '') {
      endIndex = index;
      break;
    }
  }

  const itemCount = endIndex - startIndex;
  if (itemCount <= maxItems) {
    return;
  }

  const remainingCount = itemCount - maxItems;
  const compactedLines = [
    ...lines.slice(0, startIndex + maxItems),
    `- ... ${remainingCount} more file(s) omitted from this summary to keep the AI prompt compact`,
    ...lines.slice(endIndex)
  ];

  lines.splice(0, lines.length, ...compactedLines);
}

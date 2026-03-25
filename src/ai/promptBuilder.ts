import type { CommitContext } from './providers';

const LANGUAGE_NAMES: Record<string, string> = {
  en: 'English',
  'zh-cn': 'Simplified Chinese',
  ja: 'Japanese',
  ko: 'Korean',
  es: 'Spanish',
  fr: 'French',
  de: 'German',
  ru: 'Russian',
  pt: 'Portuguese',
  it: 'Italian'
};

const LANGUAGE_INSTRUCTIONS: Record<string, string> = {
  en: '\nWrite full commit message in English.',
  'zh-cn': '\n用简体中文编写提交信息。',
  ja: '\n日本語でコミットメッセージを書いてください。',
  ko: '\n한국어로 커밋 메시지를 작성해주세요.',
  es: '\nEscribe el mensaje de commit en español.',
  fr: '\nÉcrivez le message de commit en français.',
  de: '\nSchreiben Sie die Commit-Nachricht auf Deutsch.',
  ru: '\nНапишите сообщение коммита на русском.',
  pt: '\nEscreva a mensagem de commit em português.',
  it: '\nScrivi il messaggio di commit in italiano.'
};

export function buildSystemPrompt(context: CommitContext): string {
  const languageInstructions = getLanguageInstructions(context.language);
  const languageName = getLanguageName(context.language);
  const conventionalCommitsInstruction = buildConventionalCommitsInstruction(
    context.conventionalCommits,
    languageName
  );
  const commitStyleInstruction = buildCommitStyleInstruction(context.commitMessageStyle);
  const gitmojiInstruction = buildGitmojiInstruction(context.useGitmoji);
  const customSystemPrompt = buildCustomSystemPrompt(context.customSystemPrompt);

  if (context.formatRepairDraft) {
    return `You rewrite git commit message drafts into the required output format.

Hard requirements:
- Output exactly one git commit message in ${languageName}.
- Keep the language requirement mandatory. Do not default to English unless the target language is English.
- Preserve the facts from the existing draft and the staged change summary.
- Do not invent changes, tickets, scopes, breaking changes, or release notes.${languageInstructions}${conventionalCommitsInstruction}${commitStyleInstruction}${gitmojiInstruction}${customSystemPrompt}

Return only the rewritten commit message.`;
  }

  return `You are an expert at writing clear, concise git commit messages.

Hard requirements:
- Output exactly one git commit message in ${languageName}.
- The language requirement is mandatory. Do not default to English unless the target language is English.
- Even if the diff, file names, code, and comments are in English, the final commit message must still be in ${languageName}.${languageInstructions}${conventionalCommitsInstruction}${commitStyleInstruction}${gitmojiInstruction}${customSystemPrompt}

Generate a commit message that accurately describes the changes. Focus on the "why" and "what", not just the "how". Be specific, but do not add facts that are not supported by the staged changes.

Return only the commit message, no additional text.`;
}

export function buildUserPrompt(diff: string, context: CommitContext): string {
  const languageName = getLanguageName(context.language);

  if (context.formatRepairDraft) {
    return `Rewrite the git commit draft below into the required ${context.commitMessageStyle} format in ${languageName}.
Do not add new facts or claims. Only use the draft and staged summary.

Current draft:
${context.formatRepairDraft.trim()}

Staged change summary:
${diff}`;
  }

  return `Generate exactly one git commit message in ${languageName} for the staged changes below.
The output language requirement is mandatory.
${context.conventionalCommits
  ? 'If you use Conventional Commits, keep the type token in English and write the rest in the target language.'
  : 'Do not use English unless the target language is English.'}

Staged changes:

${diff}`;
}

export function getLanguageName(language: string): string {
  return LANGUAGE_NAMES[language] || LANGUAGE_NAMES.en;
}

export function getLanguageInstructions(language: string): string {
  return LANGUAGE_INSTRUCTIONS[language] || LANGUAGE_INSTRUCTIONS.en;
}

export function buildCommitStyleInstruction(commitMessageStyle: CommitContext['commitMessageStyle']): string {
  if (commitMessageStyle === 'concise') {
    return '\nCommit message format:\n- return a single subject line only\n- do not include a blank line, body, bullet list, footer, or explanation\n';
  }

  return '\nCommit message format:\n- first line: a single subject line\n- second line: leave exactly one blank line\n- then write 2 to 5 bullet points\n- every bullet point must start with "- "\n- do not add headings, numbering, code fences, or extra commentary\n';
}

function buildConventionalCommitsInstruction(
  conventionalCommits: boolean,
  languageName: string
): string {
  if (!conventionalCommits) {
    return '';
  }

  return `\nFollow the Conventional Commits specification:\n- format: <type>[optional scope]: <description>\n- types: feat, fix, docs, style, refactor, perf, test, build, ci, chore, revert\n- keep the type token in English\n- write the scope, description, and any bullet details in ${languageName}\n- keep the description under 72 characters\n`;
}

function buildGitmojiInstruction(useGitmoji: boolean): string {
  if (!useGitmoji) {
    return '';
  }

  return '\nInclude a relevant Gitmoji at the start of the commit message:\n- ✨ for new features\n- 🐛 for bug fixes\n- 📝 for documentation\n- 🎨 for styling\n- ♻️ for refactoring\n- ⚡ for performance\n- ✅ for tests\n- 📦 for build\n- 🔀 for merge/rebase\n- 🔧 for configuration\n';
}

function buildCustomSystemPrompt(customSystemPrompt: string): string {
  const trimmedPrompt = customSystemPrompt.trim();

  if (!trimmedPrompt) {
    return '';
  }

  return `\nAdditional user instructions:\n${trimmedPrompt}\n`;
}

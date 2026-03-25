export const GITMOJIS: { [key: string]: string } = {
  'feat': '✨',
  'fix': '🐛',
  'docs': '📝',
  'style': '🎨',
  'refactor': '♻️',
  'perf': '⚡',
  'test': '✅',
  'build': '📦',
  'ci': '👷',
  'chore': '🔧',
  'revert': '⏪',
  'init': '🎉',
  'wip': '🚧',
  'release': '🏷️',
  'merge': '🔀',
  'bump': '⬆️',
  'dependencies': '➕',
  'security': '🔒',
  'breaking': '💥',
  'translation': '🌐',
  'content': '✏️',
  'assets': '🖼️',
  'accessibility': '♿'
};

export function getGitmoji(type: string): string {
  const normalizedType = type.toLowerCase().replace(/:.*$/, '');
  return GITMOJIS[normalizedType] || '📝';
}

export function addGitmojiToMessage(message: string): string {
  const trimmedMessage = message.trim();
  const normalizedMessage = removeGitmojiFromMessage(trimmedMessage);

  const conventionalTypeMatch = normalizedMessage.match(/^(feat|fix|docs|style|refactor|perf|test|build|ci|chore|revert|init|wip|release|merge|bump|dependencies|security|breaking|translation|content|assets|accessibility)(\(.*?\))?:/i);

  if (conventionalTypeMatch) {
    const type = conventionalTypeMatch[1].toLowerCase();
    const emoji = getGitmoji(type);
    return `${emoji} ${normalizedMessage}`;
  }

  if (normalizedMessage !== trimmedMessage) {
    return trimmedMessage;
  }

  return `📝 ${normalizedMessage}`;
}

export function removeGitmojiFromMessage(message: string): string {
  const gitmojiPattern = /^[\p{Emoji}\u200d]+(\s*)/u;
  return message.replace(gitmojiPattern, '$1').trim();
}

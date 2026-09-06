import { AICommitConfig } from './settingsTypes';

export const DEFAULT_CONTEXT_EXCLUDE_PATTERNS: string[] = [
  '**/package-lock.json',
  '**/npm-shrinkwrap.json',
  '**/pnpm-lock.yaml',
  '**/yarn.lock',
  '**/bun.lockb',
  '**/Cargo.lock',
  '**/composer.lock',
  '**/Gemfile.lock',
  '**/Pipfile.lock',
  '**/poetry.lock',
  '**/Podfile.lock',
  '**/packages.lock.json',
  '**/*.min.js',
  '**/*.min.css',
  '**/*.map',
  '**/*.png',
  '**/*.jpg',
  '**/*.jpeg',
  '**/*.gif',
  '**/*.webp',
  '**/*.ico',
  '**/*.pdf',
  '**/*.zip',
  '**/*.7z',
  '**/*.rar',
  '**/*.tar',
  '**/*.gz',
  '**/*.mp3',
  '**/*.mp4',
  '**/*.mov',
  '**/*.avi',
  '**/*.woff',
  '**/*.woff2',
  '**/*.ttf',
  '**/*.eot',
  '**/*.exe',
  '**/*.dll',
  '**/*.so',
  '**/*.dylib',
  '**/*.jar',
  '**/*.apk',
  '**/*.ipa',
  '**/*.aab',
  '**/*.uasset',
  '**/*.umap',
  '**/*.ubulk',
  '**/*.uexp',
  '**/*.utoc',
  '**/*.ucas',
  '**/*.pak',
  '**/DerivedDataCache/**',
  '**/Binaries/**',
  '**/Intermediate/**',
  '**/Saved/**',
  '**/Library/**',
  '**/Temp/**',
  '**/Obj/**',
  '**/dist/**',
  '**/build/**',
  '**/coverage/**',
  '**/.next/**',
  '**/.nuxt/**',
  // 密钥与凭据文件：误暂存时不应把内容发给第三方 AI
  '**/.env*',
  '**/*.pem',
  '**/*.p12',
  '**/*.pfx',
  '**/*.key',
  '**/id_rsa*',
  '**/id_ed25519*',
  '**/id_ecdsa*',
  '**/.ssh/**',
  '**/.aws/credentials*',
  '**/credentials*.json',
  '**/.git-credentials',
  '**/*.keystore',
  '**/*.jks'
];

export const DEFAULT_MAX_DIFF_CHARACTERS = 24000;
export const DEFAULT_MAX_FILE_DIFF_CHARACTERS = 8000;
export const MIN_MAX_DIFF_CHARACTERS = 4000;
export const MAX_MAX_DIFF_CHARACTERS = 200000;
export const MIN_MAX_FILE_DIFF_CHARACTERS = 1000;
export const MAX_MAX_FILE_DIFF_CHARACTERS = 50000;

export const DEFAULT_AI_COMMIT_CONFIG: AICommitConfig = {
  language: 'en',
  useGitmoji: true,
  customSystemPrompt: '',
  conventionalCommits: true,
  commitMessageStyle: 'detailed',
  temperature: 0.7,
  maxTokens: 1000,
  contextExcludePatterns: [...DEFAULT_CONTEXT_EXCLUDE_PATTERNS],
  maxDiffCharacters: DEFAULT_MAX_DIFF_CHARACTERS,
  maxFileDiffCharacters: DEFAULT_MAX_FILE_DIFF_CHARACTERS
};

export function createDefaultAICommitConfig(): AICommitConfig {
  return {
    ...DEFAULT_AI_COMMIT_CONFIG,
    contextExcludePatterns: [...DEFAULT_AI_COMMIT_CONFIG.contextExcludePatterns]
  };
}

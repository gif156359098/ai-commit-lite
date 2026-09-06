# AGENTS.md - AI Commit Lite

Guidelines for AI agents working on the AI Commit Lite VS Code extension.

## Build Commands

```bash
npm run compile     # esbuild production build (extension + webview)
npm run watch       # esbuild development watch mode
npm run lint        # ESLint check with TypeScript support
npm run typecheck   # TypeScript type checking (extension + webview)
npm test            # Compile tests and run Node test runner
npm run verify      # Full verification: typecheck + lint + test + compile
npm run package     # Package into .vsix
```

### Test Suite
- Test files exist in `test/` directory (25 .test.ts files)
- Tests use Node's built-in test runner (`node --test`)
- Run `npm test` to compile and execute tests

### Release
- Package uses `.vscodeignore` to exclude dev files
- VSIX contains only runtime assets (out/, resources/, package.json, etc.)
- Published package size is ~660KB (vs previously 13.5MB with dev files)

### Configuration
- **TypeScript**: `strict: true`, ES2020 target, `out/` output
- **esbuild**: Separate bundles for extension (CommonJS) and webview (IIFE)
- **ESLint**: Configured with @typescript-eslint/recommended rules
- **No Prettier, Cursor, or Copilot rules**

## Code Style

### Imports Order
1. VS Code API (`import * as vscode from 'vscode'`)
2. Node.js built-ins (`import { exec } from 'child_process'`)
3. Third-party libraries (`import axios from 'axios'`)
4. Local modules (`import { getConfig } from '../config/settings'`)

### Formatting
- **Indentation**: 2 spaces
- **Semicolons**: Always
- **Quotes**: Single quotes
- **Braces**: Always include for control structures
- **Line length**: No explicit limit (follow VS Code defaults)

### TypeScript
- **Explicit types**: Functions, parameters, returns
- **Interfaces** for object shapes
- **Strict mode**: Handle null/undefined, use `?.` and `??`
- **No `as any`**, `@ts-ignore`, or `@ts-expect-error` without justification

### Naming
- **Files**: `camelCase.ts` (regular), `PascalCase.ts` (classes)
- **Variables/functions**: `camelCase`
- **Classes/interfaces/types**: `PascalCase`
- **Constants**: `UPPER_SNAKE_CASE`

### Error Handling
```typescript
try {
  const result = await operation();
} catch (error: any) {
  throw new Error(`Specific context: ${error.message}`);
}
```

- Provide actionable error messages
- Include API error context: `error.response?.data?.error?.message || error.message`
- Validation functions return `{ valid: boolean; errors: string[] }`

## Project Patterns

### AI Providers
```typescript
export interface AIProvider {
  generateCommitMessage(diff: string, context: CommitContext): Promise<string>;
}
// Extend BaseAIProvider or implement AIProvider
```

### Configuration
```typescript
export function getConfig(): AICommitConfig {
  const vscode = require('vscode');
  const config = vscode.workspace.getConfiguration('aiCommitLite');
  return { apiProvider: config.get('apiProvider', 'openai'), ... };
}
```

### Git Operations
```typescript
export async function getStagedDiffRaw(): Promise<string> {
  try {
    const { stdout } = await execAsync('git diff --staged');
    return stdout;
  } catch (error: any) {
    throw new Error(`Failed to get git diff: ${error.message}`);
  }
}
// Use promisify(exec) for child_process operations
```

## Multilingual Support

### Language Configuration
- **Configuration schema**: `en`, `zh-cn`, `ja`, `ko`, `es`, `fr`, `de`, `ru`, `pt`, `it`
- **AI Providers**: Use `config.language` to generate commit messages in the selected language
- **UI Localization**: `package.nls.*.json` for VS Code chrome; `src/i18n/locales/*.json` for in-extension messages (10 locales)

### Adding New Languages
1. Add translation file: `package.nls.{locale}.json`
2. Update `src/i18n.ts` to support new locale
3. Ensure `getLanguageName()` in `src/ai/providers.ts` supports the language

## VS Code Extension

### Command Registration
```typescript
export function activate(context: vscode.ExtensionContext) {
  const disposable = vscode.commands.registerCommand(
    'ai-commit-lite.generateCommit',
    generateCommitCommand
  );
  context.subscriptions.push(disposable);
}
```

### Progress Reporting
```typescript
vscode.window.withProgress({
  location: vscode.ProgressLocation.Notification,
  title: 'Generating commit message...',
  cancellable: false
}, async (progress) => {
  progress.report({ increment: 30, message: 'Analyzing changes...' });
  // Operation
});
```

## Development Workflow

### Git Commit Discipline（重要）
- 提交前必须运行 `git status --short` 并逐项确认：只包含预期文件，绝不批量 `git add .`
- **禁止提交任何评审/临时产物**：`.pr-review/`、`.memsearch/`、`.claude/`、`.opencode/`、`.serena/` 等目录已被 `.gitignore` 排除；commit message 等中间文件也不得 add（先 add 再写临时文件，或用 `git commit -m` 多段落）
- 提交历史是公开且几乎不可逆的：任何含会话日志、diff 副本、账号信息的内容一旦 push 将永久可见
- 发布前运行 `npx vsce ls` 抽查打包清单是否包含意外文件

### Adding AI Provider
1. Create class in `src/ai/`
2. Extend `BaseAIProvider` or implement `AIProvider`
3. Add to factory in `src/commit/generator.ts`
4. Update `package.json` configuration schema

### Code Review Checklist
- [ ] Follows import order
- [ ] Proper error handling with specific messages
- [ ] TypeScript strict compliance
- [ ] Consistent naming conventions
- [ ] No hardcoded values (use configuration)
- [ ] Proper async/await usage
- [ ] No `console.log` in production code

## Quick Reference
- **Commands**: `compile` (production), `watch` (development), `lint`, `package`
- **Patterns**: VS Code → Node.js → Third-party → Local imports, try-catch with context, explicit types


<claude-mem-context>
# Memory Context

# claude-mem status

This project has no memory yet. The current session will seed it; subsequent sessions will receive auto-injected context for relevant past work.

Memory injection starts on your second session in a project.

`/learn-codebase` is available if the user wants to front-load the entire repo into memory in a single pass (~5 minutes on a typical repo, optional). Otherwise memory builds passively as work happens.

Live activity: http://localhost:37777
How it works: `/how-it-works`

This message disappears once the first observation lands.
</claude-mem-context>
# AGENTS.md - AI Commit Lite

Guidelines for AI agents working on the AI Commit Lite VS Code extension.

## Build Commands

```bash
npm run compile    # Webpack production build
npm run watch      # Webpack development watch mode
npm run lint       # Lint with ESLint
npm run package    # Package into .vsix
```

**No test suite**: `npm test` is not defined. No test files exist.

### Configuration
- **TypeScript**: `strict: true`, ES2020 target, `out/` output
- **Webpack**: Node.js target, `vscode` external
- **ESLint**: Default TypeScript rules (no config file)
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
- **Configuration schema**: `en`, `zh`, `ja`, `ko`, `es`, `fr`, `de`, `ru`
- **AI Providers**: Use `config.language` to generate commit messages in the selected language
- **UI Localization**: Currently supports English (`en`) and Simplified Chinese (`zh-cn`) only
- **Inconsistency**: Configuration uses `zh` while i18n and VS Code localization use `zh-cn`

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

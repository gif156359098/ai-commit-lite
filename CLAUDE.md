# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

AI Commit Lite is a VS Code extension that uses AI to generate commit messages from staged Git changes. It supports multiple AI providers (OpenAI, Azure, DeepSeek, Gemini, Anthropic, Cohere, Mistral, DashScope, and OpenAI-compatible services) through a profile-based workflow.

## Build Commands

```bash
npm run compile   # Production build (extension + webview)
npm run watch     # Watch mode for development
npm run lint      # ESLint check
npm test          # Run tests (compiles first, then runs Node tests)
npm run package   # Package as .vsix
```

## Architecture

### Entry Points

- **Extension entry**: `src/extension.ts` → `src/activation/activateExtension.ts`
- **Webview entry**: `src/webview/profileManagerMain.ts` (separate bundle for browser)

### Build System

- Uses **esbuild** via `scripts/build.mjs`
- Two separate compilation targets:
  - Extension code → `out/extension.js` (CommonJS, Node)
  - Webview code → `out/webview/profileManager.js` (IIFE, browser)
- Each uses its own `tsconfig`: `tsconfig.json` and `tsconfig.webview.json`

### Core Flow

1. **Git Integration** (`src/git/`): Collects staged changes via VS Code SCM API
2. **Diff Processing** (`src/git/diff.ts`): Batches diff processing with configurable limits
3. **AI Providers** (`src/ai/`): Provider-specific API clients with unified interface
4. **Profile System** (`src/config/profileManager.ts`): Manages multiple provider configs
   - API keys stored in VS Code Secret Storage (not plain settings)
   - Supports automatic fallback when profiles hit rate limits
5. **UI** (`src/commands/profileManagerPanel.ts`): Webview-based profile management panel

### Provider Architecture

Provider implementations follow a common pattern but differ in API specifics:
- `src/ai/openai.ts`: OpenAI, DeepSeek, Cohere, Mistral, DashScope
- `src/ai/azure.ts`: Azure OpenAI
- `src/ai/gemini.ts`: Google Gemini
- `src/ai/anthropic.ts`: Anthropic (different API format)
- `src/ai/openaiCompatible.ts`: OpenAI-compatible services

### Key Files

- `src/ai/providers.ts`: Factory that creates provider instances based on profile config
- `src/core/generateCommitMessage.ts`: Main orchestration logic
- `src/commit/messagePostProcessor.ts`: Handles format validation/repair
- `src/i18n.ts`: Internationalization using VS Code's l10n API
- `src/config/settings.ts`: Global extension settings with defaults

### Tests

Located in `test/` directory with the same structure as `src/`. Tests use Node's built-in test runner (via `node --test`).
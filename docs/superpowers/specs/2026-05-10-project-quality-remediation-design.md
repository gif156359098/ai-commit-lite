# Project Quality Remediation Design

Date: 2026-05-10
Status: Approved design for implementation by another model
Scope: Engineering remediation for AI Commit Lite VS Code extension

## Purpose

Restore reliable release packaging and quality gates for the AI Commit Lite extension without changing user-facing product behavior. The current project has a workable source architecture, but release hygiene and verification scripts are not trustworthy enough to support safe iteration.

This spec is written as an execution contract for another model. The implementing model should fix items in priority order, keep changes targeted, and verify each phase with the listed commands before moving on.

## Current Evidence

The following findings were verified on 2026-05-10:

- `npm run compile` exits successfully, but it only runs the esbuild production bundle.
- `npx tsc -p tsconfig.json --noEmit` exits successfully for the main extension.
- `npx tsc -p tsconfig.webview.json --noEmit` exits successfully for the webview.
- `npm test` fails during `npm run compile:test`.
- `npm run lint` fails because ESLint cannot find a configuration file.
- The existing `ai-commit-lite-1.3.2.vsix` is 13.56 MB and contains 4140 entries.
- The existing VSIX contains `.opencode/`, `.claude/`, `src/`, `test/`, and other development-only content.
- `.opencode/` alone accounts for 3450 entries in the existing VSIX.
- There is no `.vscodeignore`.
- `AGENTS.md` says there is no test suite, but `package.json` defines `npm test` and the repository contains 21 `.test.ts` files.
- `AGENTS.md` says the project uses Webpack, but the actual build uses `scripts/build.mjs` with esbuild.

## Goals

- Make VSIX contents deterministic and minimal.
- Make `npm test`, `npm run lint`, and TypeScript checks reliable enough for CI or prepublish use.
- Keep the extension's existing commands, settings, profile behavior, and AI provider behavior compatible.
- Reduce large-diff failure risk in staged diff collection.
- Improve security and maintainability hotspots without broad rewrites.
- Leave a clear verification trail for each phase.

## Non-Goals

- Do not redesign the profile manager UI.
- Do not add new AI providers.
- Do not change the public configuration schema except for additive internal scripts or development-only tooling.
- Do not remove existing supported locales.
- Do not migrate the project to a different package manager.
- Do not replace esbuild with Webpack.
- Do not perform broad file splitting unless required to complete the targeted fixes.
- Do not change commit-message prompt semantics beyond what is needed for tests or provider hardening.

## Phase P0: Release Hygiene

### Problem

The package currently relies on default `vsce` inclusion behavior. `.gitignore` is not enough to control published extension contents. The current VSIX includes development directories, source files, tests, and local agent state.

### Required Changes

Create a `.vscodeignore` that excludes development-only inputs from the VSIX while keeping runtime assets available.

The ignore list must exclude at least:

- `.git/**`
- `.github/**` if present
- `.vscode/**`
- `.claude/**`
- `.opencode/**`
- `docs/**`
- `scripts/**`
- `src/**`
- `test/**`
- `out-test/**`
- `node_modules/**` if the runtime bundle does not require unpacked dependencies
- `*.vsix`
- `*.tsbuildinfo`
- logs and coverage outputs

The package must retain at least:

- `out/extension.js`
- `out/webview/profileManager.js`
- `resources/**`
- `package.json`
- `package.nls*.json`
- `README*.md`
- `LICENSE`
- `icon.png`

If `node_modules/**` cannot be excluded because of an unbundled runtime dependency, the implementing model must first prove which runtime import requires it. Do not keep all dependencies in the package by default.

### Acceptance Criteria

- `npm run package` succeeds.
- The generated VSIX does not contain `.opencode/`.
- The generated VSIX does not contain `.claude/`.
- The generated VSIX does not contain `src/`.
- The generated VSIX does not contain `test/`.
- The generated VSIX does not contain `out-test/`.
- The generated VSIX does not contain a nested `*.vsix`.
- The generated VSIX contains `extension/out/extension.js`.
- The generated VSIX contains `extension/out/webview/profileManager.js`.
- The generated VSIX contains expected icons and localization files.

Suggested verification commands:

```powershell
npm run package
tar -tf ai-commit-lite-*.vsix | Select-String -Pattern '^extension/(\.opencode|\.claude|src|test|out-test)/'
tar -tf ai-commit-lite-*.vsix | Select-String -Pattern '^extension/out/extension.js$|^extension/out/webview/profileManager.js$'
```

## Phase P0: Quality Gates

### Problem

The current scripts do not provide a dependable quality gate:

- `compile` bundles with esbuild but does not run TypeScript semantic checks.
- `lint` invokes ESLint without any config and fails immediately.
- `test` fails in TypeScript compilation before executing tests.
- `vscode:prepublish` only runs `compile`.

### Required Changes

Add scripts that make verification explicit and composable:

- `typecheck`: checks main extension and webview TypeScript without emitting files.
- `typecheck:extension`: runs `tsc -p tsconfig.json --noEmit`.
- `typecheck:webview`: runs `tsc -p tsconfig.webview.json --noEmit`.
- `lint`: runs ESLint with a real project config.
- `test`: compiles test output and runs Node's test runner.
- `verify`: runs typecheck, lint, test, and compile.

Update `vscode:prepublish` to use a trustworthy verification path. The recommended target is:

```json
"vscode:prepublish": "npm run verify"
```

If package time becomes too high, `vscode:prepublish` may use a narrower but still safe sequence:

```json
"vscode:prepublish": "npm run typecheck && npm test && npm run compile"
```

### ESLint Requirements

Add an ESLint config compatible with the installed ESLint 8 and `@typescript-eslint` 6 stack.

The lint config should:

- Parse TypeScript source.
- Lint `src/**/*.ts`.
- Avoid linting generated output.
- Avoid broad stylistic churn.
- Catch obvious unused variables/imports if practical.
- Not require Prettier.

If linting all files creates noisy legacy findings, prefer a small targeted rule set over disabling lint entirely.

### Acceptance Criteria

- `npm run lint` exits with code 0.
- `npm run typecheck` exits with code 0.
- `npm test` exits with code 0.
- `npm run compile` exits with code 0.
- `npm run verify` exits with code 0.
- `npm run package` still exits with code 0 after quality gate changes.

## Phase P1: Test Configuration And Stale Tests

### Problem

`tsconfig.test.json` includes all of `src/**/*.ts`, including browser-only webview code, but only declares the `ES2020` lib and `node` types. This makes DOM globals such as `window`, `document`, `HTMLElement`, and `MouseEvent` unavailable during test compilation.

Some tests are stale relative to current implementation. For example, `test/commands/profileManagerPanelOperations.test.ts` imports `getDeleteProfileConfirmation`, which is no longer exported by `src/commands/profileManagerPanelOperations.ts`.

### Required Changes

Fix the test compilation strategy. Acceptable approaches:

- Add `DOM` to the test compiler libs if tests intentionally compile browser code.
- Or exclude `src/webview/**` from `tsconfig.test.json` and add separate webview typecheck coverage through `tsconfig.webview.json`.
- Or split test configs into extension tests and webview tests if that creates clearer ownership.

The recommended approach is:

- Keep Node unit tests focused on extension-side modules.
- Exclude `src/webview/**` from `tsconfig.test.json`.
- Keep `npx tsc -p tsconfig.webview.json --noEmit` in `typecheck:webview` so webview code remains checked.

Update stale tests to match current behavior. Do not delete meaningful tests just to make the command pass.

### Acceptance Criteria

- `npm run compile:test` exits with code 0.
- `npm test` executes Node test files and exits with code 0.
- Existing behavioral coverage for profile manager operations remains represented.
- Webview code remains covered by `typecheck:webview`.

## Phase P1: Diff Collection Performance

### Problem

`getPreparedStagedDiff` collects staged file metadata and then reads the complete staged patch map before applying context filters. Large generated files or lockfiles can still consume process memory and hit the git output buffer even when the project later filters or summarizes them.

### Required Changes

Refactor staged diff collection so filtering and context budgeting happen before expensive patch extraction where possible.

The design should preserve existing output semantics:

- Staged file summaries should still include all staged files.
- Files matching `contextExcludePatterns` should still appear as summary-only entries.
- Included files should still be prioritized by source/config/docs/test categories.
- Per-file and total context limits should still be enforced.
- Binary files should remain summary-only if no textual patch is available.

Recommended implementation direction:

1. Read staged file metadata with `--name-status` and `--numstat`.
2. Prioritize files.
3. Skip patch extraction for excluded files.
4. For candidate files, fetch patch content per file or in bounded batches.
5. Stop fetching full patches when the total context budget is exhausted.
6. Keep summary-only records for all omitted files with clear reasons.

Avoid shell string interpolation for file paths. Use `execFile` args and `--` path separators.

### Acceptance Criteria

- Existing diff parsing and diff context tests pass.
- Add or update tests proving excluded files do not need patch content to be summarized.
- Add or update tests proving context-budget exhaustion does not drop staged file summaries.
- Cancellation behavior via `AbortSignal` remains intact.
- Error messages still use localized `failedToGetGitDiff` context.

## Phase P1: Activation Cost Review

### Problem

The extension activates on `onStartupFinished`. On activation it initializes profile manager state, registers commands, creates the status bar item, opens the output channel subscription, and triggers empty-profile onboarding.

This may be acceptable, but it should be a deliberate choice because startup activation affects every VS Code window where the extension is installed.

### Required Changes

Evaluate whether the extension needs startup activation.

Acceptable outcomes:

- Keep `onStartupFinished` and document why status bar and onboarding require it.
- Or switch to command-based activation and make status bar initialization lazy.
- Or use a narrower activation event if VS Code supports the required UX without startup activation.

Do not remove commands or break the status bar command.

### Acceptance Criteria

- All contributed commands still register and execute under the chosen activation model.
- The profile manager can still open from command palette or status bar if status bar is retained.
- Empty-profile onboarding still appears at an intentional time, or is explicitly moved behind a user action.
- The chosen activation behavior is documented in a code comment or project docs if non-obvious.

## Phase P2: Webview Security Hardening

### Problem

The webview CSP nonce is generated with `Math.random()`. The current CSP also allows inline styles through `'unsafe-inline'`.

### Required Changes

Replace nonce generation with a cryptographically stronger source.

Acceptable options:

- Use Node `crypto.randomBytes`.
- Use Web Crypto if available in the extension host environment.

Keep the returned nonce alphanumeric or otherwise safe for direct CSP use.

Inline styles may remain if removing them requires broad UI refactoring, but this should be called out as an accepted residual risk.

### Acceptance Criteria

- Webview still renders.
- Scripts still load under CSP.
- Nonce generation no longer uses `Math.random()`.
- Existing profile manager panel HTML tests are updated and pass.

## Phase P2: Provider And Connection-Test Hardening

### Problem

Provider code contains some hardcoded operational details and the connection test sends an actual generation request with a tiny output budget.

Specific issues:

- Azure API version is hardcoded in the request URL.
- Connection test uses `provider.generateCommitMessage('test', ...)`, which can consume user quota and may fail on providers that need more than `maxTokens: 10`.
- Provider HTTP timeout behavior is inconsistent. Connection test has a 30-second abort, normal generation relies on user cancellation and provider/network behavior.

### Required Changes

Centralize provider constants where practical:

- Move Azure API version to a named constant.
- Consider exposing provider-specific lightweight validation paths only if they can be implemented without broad provider rewrites.

Improve connection-test semantics:

- Keep user-visible behavior clear that testing may contact the provider.
- Avoid token limits that are too low for normal provider behavior.
- Preserve the 30-second timeout.
- Do not leak API keys in error output.

Do not introduce broad provider abstractions unless required for these targeted fixes.

### Acceptance Criteria

- Existing provider tests pass.
- Connection test still reports success/failure and latency.
- API keys are not logged or displayed.
- Azure request URL behavior remains compatible.
- Constants are named and easy to find.

## Phase P2: Documentation And Minor Maintainability

### Problem

Development docs are stale and there are small unused-code issues.

### Required Changes

Update `AGENTS.md` to match the actual project:

- Build uses esbuild, not Webpack.
- `npm test` is defined.
- Test files exist.
- Quality gate commands should match the final `package.json` scripts.

Clean up verified unused code:

- Remove unused `getProviderDefinition` import from `src/commit/generator.ts`.
- Remove or use the unused `profileFallbackOrder` parameter in `reorderFallbackProfiles`.

Keep formatting consistent with existing project style.

### Acceptance Criteria

- `AGENTS.md` no longer contradicts `package.json`.
- Strict TypeScript checks still pass.
- Optional stricter check `npx tsc -p tsconfig.json --noEmit --noUnusedLocals --noUnusedParameters` has no findings, unless the team chooses not to enforce it and documents why.

## Recommended Implementation Order

1. Add `.vscodeignore` and verify package contents.
2. Add typecheck and verify scripts.
3. Add ESLint config and make `npm run lint` pass.
4. Fix `tsconfig.test.json` and stale tests until `npm test` passes.
5. Update `vscode:prepublish` only after quality commands pass individually.
6. Update `AGENTS.md` to match the new workflow.
7. Optimize staged diff collection with focused tests.
8. Review activation behavior.
9. Apply webview nonce and provider hardening.
10. Run the full verification matrix and package inspection.

## Full Verification Matrix

The final implementation must run these commands from the repository root:

```powershell
npm run compile
npx tsc -p tsconfig.json --noEmit
npx tsc -p tsconfig.webview.json --noEmit
npm run typecheck
npm run lint
npm test
npm run verify
npm run package
```

The final implementation must inspect the generated VSIX:

```powershell
tar -tf ai-commit-lite-*.vsix | Select-String -Pattern '^extension/(\.opencode|\.claude|src|test|out-test)/'
tar -tf ai-commit-lite-*.vsix | Select-String -Pattern '^extension/out/extension.js$|^extension/out/webview/profileManager.js$'
```

The first command should produce no matches. The second command should find both runtime bundles.

## Risk Controls

- Keep changes small and phase-based.
- Do not rewrite large files unless a targeted fix requires it.
- Do not delete tests without replacing their behavioral coverage.
- Do not make package contents minimal by removing required runtime assets.
- Do not hide failing lint or tests by weakening scripts to no-op commands.
- Do not change user-facing settings or provider defaults unless explicitly required.
- Preserve current localization key coverage.

## Handoff Notes For Implementing Model

Use the verified failures as the starting point. Do not assume `npm run compile` proves type safety. The core issue is that the project has separate build, typecheck, lint, test, and package concerns that are currently not wired together into one trustworthy gate.

The highest-value fix is to make `npm run verify` meaningful and make the VSIX package small and deterministic. Performance and hardening work should come after that baseline is restored.

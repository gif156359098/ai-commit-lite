# Profile Connection Test Design

## Overview

Add a "Test Connection" button to each Profile card in the Profile Manager UI, allowing users to verify whether their AI service configuration (API key, endpoint, model) is working correctly before attempting to generate commit messages.

## Data Flow

```
User clicks test button
  → webview: card status → "testing"
    → postMessage({ command: 'testProfile', profileId })
      → extension: ProfileManagerPanel.handleTestProfile()
        → Secret Storage → API Key
        → providerFactory.createAIProvider()
        → provider.generateCommitMessage("test", minimalContext)
        → measure latency
      ← postMessage({ command: 'testResult', profileId, success, latencyMs, errorMessage? })
    → webview: update card status
      → success: show "✓ Connected - 1.2s" for 3s, then auto-dismiss
      → error: show "✗ Connection Failed" for 5s, then auto-dismiss
               + VS Code notification with "View Details" button
```

## Webview UI

### Button Placement

Test button (lightning icon) inserted before Edit and Delete buttons in each card's `card-actions` area.

```
card-actions:
  [Use this profile]  [⚡][✏️][🗑️]
```

### Test State Management

```typescript
interface TestCardState {
  status: 'idle' | 'testing' | 'success' | 'error';
  latencyMs?: number;
  errorMessage?: string;
  dismissTimer?: ReturnType<typeof setTimeout>;
}

const testStates = new Map<string, TestCardState>();
```

- Auto-dismiss: success after 3s, error after 5s
- Clear state on profile switch, edit, delete, or state update

### State Rendering

| Status | Card Display |
|--------|-------------|
| `idle` | Lightning bolt button only |
| `testing` | CSS spinning animation (replaces button icon) |
| `success` | Green "✓ Connected - 1.2s" |
| `error` | Red "✗ Connection Failed" |

## Extension Logic

### New File: `src/commands/profileConnectionTester.ts`

```typescript
export interface TestConnectionResult {
  success: boolean;
  latencyMs?: number;
  errorMessage?: string;
}

export async function testProfileConnection(profileId: string): Promise<TestConnectionResult>
```

- Retrieves profile and API key from Secret Storage
- Resolves endpoint from profile or provider definition
- Creates AI provider via `providerFactory.createAIProvider()`
- Sends minimal chat completion request (diff: "test", maxTokens: 10, timeout: 30s)
- Measures round-trip latency
- Returns structured result

### New File: `src/ai/providerFactory.ts`

Extracts `createAIProvider()` from `src/commit/generator.ts` into a shared module.

### Panel Handler

`ProfileManagerPanel.handleTestProfile()`:
- Invokes `testProfileConnection()`
- Posts result back to webview
- On error: shows VS Code `showErrorMessage()` with "View Details" action button
- "View Details" opens an output channel with full error details

### Output Channel

`AI Commit Lite (Connection Test)` — created on demand, cleared before each use.

## i18n New Keys

### Webview

| Key | en | zh-cn |
|-----|----|-------|
| `testAction` | Test | 测试 |
| `testConnectionSuccess` | Connected | 连接成功 |
| `testConnectionFailed` | Connection Failed | 连接失败 |

### Extension

| Key | en | zh-cn |
|-----|----|-------|
| `testConnectionErrorTitle` | Profile "{profile}" connection test failed | Profile "{profile}" 连接测试失败 |
| `viewErrorDetailsAction` | View Details | 查看详情 |

## Files Changed

### New files
- `src/ai/providerFactory.ts`
- `src/commands/profileConnectionTester.ts`

### Modified files
- `src/commit/generator.ts` — import from providerFactory
- `src/webview/profileManagerMain.ts` — test button, state, event handlers
- `src/commands/profileManagerPanel.ts` — testProfile message handler
- `src/commands/profileManagerPanelTypes.ts` — WebviewI18n new keys
- `src/commands/profileManagerPanelI18n.ts` — map new keys
- `src/commands/profileManagerPanelStyles.ts` — test status CSS
- `src/i18n/locales/en.json`, `zh-cn.json`, `ja.json`, `ko.json`, `es.json`, `fr.json`, `de.json`, `ru.json`, `pt.json`, `it.json`

## Edge Cases

- **No API key stored**: test immediately returns "API key not found" error
- **Profile not found**: should not happen (UI only shows existing profiles), but handled gracefully
- **Request timeout**: 30s abort, shows timeout error message
- **Rapid clicking**: state transitions prevent concurrent tests — if already testing, ignore subsequent clicks
- **Profile switch during test**: possible race condition; result for old profile ID is silently ignored
- **Empty response from API**: handled as failure with "empty response" error message
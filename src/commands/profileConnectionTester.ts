import * as vscode from 'vscode';
import { createAIProvider } from '../ai/providerFactory';
import { CommitContext } from '../ai/providers';
import { checkHasStagedChanges, getStagedDiff } from '../git/diff';
import { getProviderDefinition } from '../ai/providerRegistry';
import { getProfileApiKey, getProfiles } from '../config/profileManager';
import { getConfig } from '../config/settings';
import { appendInfo } from '../ui/output';
import { t } from '../i18n';

let testOutputChannel: vscode.OutputChannel | undefined;

function getTestOutputChannel(): vscode.OutputChannel {
  if (!testOutputChannel) {
    testOutputChannel = vscode.window.createOutputChannel('AI Commit Lite (Connection Test)');
  }
  return testOutputChannel;
}

export interface TestConnectionResult {
  success: boolean;
  latencyMs?: number;
  errorMessage?: string;
}

export async function testProfileConnection(profileId: string): Promise<TestConnectionResult> {
  const profile = getProfiles().find((p) => p.id === profileId);
  if (!profile) {
    return { success: false, errorMessage: 'Profile not found' };
  }

  const apiKey = await getProfileApiKey(profileId);
  if (!apiKey) {
    return { success: false, errorMessage: 'API key not found' };
  }

  const providerDefinition = getProviderDefinition(profile.provider);
  const apiEndpoint = profile.baseUrl || providerDefinition.defaultBaseUrl || '';

  const baseConfig = getConfig();

  const config = {
    ...baseConfig,
    profile,
    apiKey,
    apiEndpoint
  };

  const start = Date.now();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(new Error('Request timed out')), 30_000);

  try {
    const provider = createAIProvider(config);

    const testContext: CommitContext = {
      language: config.language,
      useGitmoji: false,
      conventionalCommits: false,
      commitMessageStyle: 'concise',
      temperature: 0,
      maxTokens: config.maxTokens,
      customSystemPrompt: ''
    };

    const realDiff = await getRealDiffForTest(controller.signal);
    await provider.generateCommitMessage(realDiff, testContext, controller.signal);

    const latencyMs = Date.now() - start;
    appendInfo(
      `Connection test: ${profile.label} | ${providerDefinition.label}/${profile.model} | ${latencyMs}ms`
    );
    return { success: true, latencyMs };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    const latencyMs = Date.now() - start;
    return { success: false, latencyMs, errorMessage: message };
  } finally {
    clearTimeout(timeout);
  }
}

async function getRealDiffForTest(abortSignal?: AbortSignal): Promise<string> {
  const hasStaged = await checkHasStagedChanges(abortSignal);
  if (!hasStaged) {
    return `diff --git a/test.ts b/test.ts
--- a/test.ts
+++ b/test.ts
@@ -1,3 +1,4 @@
+// Test line for API validation`;
  }

  try {
    const diff = await getStagedDiff();
    const firstFile = diff.files[0];
    if (firstFile) {
      return `[Testing API with sample diff content for: ${firstFile.path}]
File: ${firstFile.path}
Status: ${firstFile.status}
Changes: +${firstFile.additions} -${firstFile.deletions}
This is a test request to validate the API connection.`;
    }
  } catch {
    // Fall through to synthetic diff
  }

  return '[Test request to validate API connection]';
}

export function showTestErrorNotification(profileLabel: string, errorMessage: string): void {
  const channel = getTestOutputChannel();
  channel.clear();
  channel.appendLine(`Profile: ${profileLabel}`);
  channel.appendLine(`Error: ${errorMessage}`);
  channel.appendLine('---');

  void vscode.window.showErrorMessage(
    t('testConnectionErrorTitle', { profile: profileLabel }),
    t('viewErrorDetailsAction')
  ).then((action) => {
    if (action === t('viewErrorDetailsAction')) {
      getTestOutputChannel().show();
    }
  });
}
import * as vscode from 'vscode';
import { createAIProvider } from '../ai/providerFactory';
import { CommitContext } from '../ai/providers';
import { getProviderDefinition } from '../ai/providerRegistry';
import { getProfileApiKey, getProfiles } from '../config/profileManager';
import { getConfig } from '../config/settings';
import { t } from '../i18n';

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
      language: 'en',
      useGitmoji: false,
      conventionalCommits: false,
      commitMessageStyle: 'concise',
      temperature: 0,
      maxTokens: 10,
      customSystemPrompt: ''
    };

    await provider.generateCommitMessage('test', testContext, controller.signal);

    return { success: true, latencyMs: Date.now() - start };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return { success: false, latencyMs: Date.now() - start, errorMessage: message };
  } finally {
    clearTimeout(timeout);
  }
}

const outputChannel = vscode.window.createOutputChannel('AI Commit Lite (Connection Test)');

export function showTestErrorNotification(profileLabel: string, errorMessage: string): void {
  outputChannel.clear();
  outputChannel.appendLine(`Profile: ${profileLabel}`);
  outputChannel.appendLine(`Error: ${errorMessage}`);
  outputChannel.appendLine('---');

  void vscode.window.showErrorMessage(
    t('testConnectionErrorTitle', { profile: profileLabel }),
    t('viewErrorDetailsAction')
  ).then((action) => {
    if (action === t('viewErrorDetailsAction')) {
      outputChannel.show();
    }
  });
}
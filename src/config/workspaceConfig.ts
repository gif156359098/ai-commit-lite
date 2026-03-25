import * as vscode from 'vscode';

export const AI_COMMIT_CONFIGURATION_SECTION = 'aiCommitLite';
export const LEGACY_AI_COMMIT_CONFIGURATION_SECTION = 'aiCommitPro';

export type WorkspaceConfigReader = <T>(key: string, defaultValue: T) => T;

export function getAICommitWorkspaceConfig(): vscode.WorkspaceConfiguration {
  return vscode.workspace.getConfiguration(AI_COMMIT_CONFIGURATION_SECTION);
}

export function getLegacyAICommitWorkspaceConfig(): vscode.WorkspaceConfiguration {
  return vscode.workspace.getConfiguration(LEGACY_AI_COMMIT_CONFIGURATION_SECTION);
}

export function readAICommitConfigValue<T>(key: string, defaultValue: T): T {
  const currentConfig = getAICommitWorkspaceConfig();
  if (hasExplicitConfigValue(currentConfig, key)) {
    return currentConfig.get(key, defaultValue);
  }

  const legacyConfig = getLegacyAICommitWorkspaceConfig();
  if (hasExplicitConfigValue(legacyConfig, key)) {
    return legacyConfig.get(key, defaultValue);
  }

  return currentConfig.get(key, defaultValue);
}

export async function updateAICommitConfigValue<T>(
  key: string,
  value: T,
  target: vscode.ConfigurationTarget = vscode.ConfigurationTarget.Global
): Promise<void> {
  await getAICommitWorkspaceConfig().update(key, value, target);
}

function hasExplicitConfigValue(
  config: vscode.WorkspaceConfiguration,
  key: string
): boolean {
  const inspection = config.inspect(key);

  if (!inspection) {
    return false;
  }

  return inspection.globalValue !== undefined
    || inspection.workspaceValue !== undefined
    || inspection.workspaceFolderValue !== undefined
    || inspection.globalLanguageValue !== undefined
    || inspection.workspaceLanguageValue !== undefined
    || inspection.workspaceFolderLanguageValue !== undefined;
}


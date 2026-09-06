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

/**
 * 仅读取应用全局（user settings）层的配置值，忽略 workspace / workspace folder 覆盖。
 *
 * profile 相关的敏感配置（profiles/activeProfile/profileFallbackOrder 等）必须通过此
 * 函数读取：API key 由 profile id 关联全局 SecretStorage，若允许恶意仓库通过
 * .vscode/settings.json 覆盖 baseUrl 或 profile id，会形成"密钥重定向"攻击通道。
 */
export function readGlobalAICommitConfigValue<T>(key: string, defaultValue: T): T {
  const globalValue = getAICommitWorkspaceConfig().inspect(key)?.globalValue;
  return globalValue === undefined ? defaultValue : (globalValue as T);
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


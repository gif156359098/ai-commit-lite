import * as vscode from 'vscode';

import { PROFILE_MANAGER_STATUS_BAR_DESCRIPTOR } from './extensionManifest';

export function createProfileManagerStatusBarItem(tooltip: string): vscode.StatusBarItem {
  const statusBarItem = vscode.window.createStatusBarItem(
    PROFILE_MANAGER_STATUS_BAR_DESCRIPTOR.id,
    vscode.StatusBarAlignment.Left
  );

  statusBarItem.name = PROFILE_MANAGER_STATUS_BAR_DESCRIPTOR.name;
  statusBarItem.text = PROFILE_MANAGER_STATUS_BAR_DESCRIPTOR.text;
  statusBarItem.tooltip = tooltip;
  statusBarItem.command = PROFILE_MANAGER_STATUS_BAR_DESCRIPTOR.command;

  return statusBarItem;
}

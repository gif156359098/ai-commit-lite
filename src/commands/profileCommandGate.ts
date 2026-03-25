import * as vscode from 'vscode';

import { getProfiles } from '../config/profileManager';
import {
  resolveProfileManagerPanelAction
} from './profileCommandHelpers';
import { ensureProfilesOrPrompt } from './profileOnboarding';
import { ProfileManagerPanel } from './profileManagerPanel';
import { ProfileManagerPanelAction } from './profileManagerPanelTypes';

export function openProfileManagerPanel(
  extensionUri: vscode.Uri,
  requestedAction: ProfileManagerPanelAction = 'default'
): void {
  const action = resolveProfileManagerPanelAction(getProfiles().length, requestedAction);
  ProfileManagerPanel.createOrShow(extensionUri, action);
}

export async function ensureProfilesForCommand(extensionUri: vscode.Uri): Promise<boolean> {
  return await ensureProfilesOrPrompt(extensionUri);
}

export async function ensureProfilesThenOpenProfileManager(
  extensionUri: vscode.Uri,
  action: Exclude<ProfileManagerPanelAction, 'default'>
): Promise<void> {
  if (!await ensureProfilesForCommand(extensionUri)) {
    return;
  }

  openProfileManagerPanel(extensionUri, action);
}

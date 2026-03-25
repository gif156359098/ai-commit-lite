import * as vscode from 'vscode';

import { getProfiles } from '../config/profileManager';
import { t } from '../i18n';
import {
  getEmptyProfilePromptDescriptor,
  shouldShowEmptyProfileOnboarding
} from './profileCommandHelpers';
import { openProfileManagerPanel } from './profileCommandGate';

const EMPTY_PROFILE_ONBOARDING_SHOWN_KEY = 'aiCommitLite.emptyProfileOnboardingShown';

export async function showEmptyProfileOnboardingIfNeeded(
  context: vscode.ExtensionContext,
  extensionUri: vscode.Uri
): Promise<void> {
  const profileCount = getProfiles().length;
  const alreadyShown = context.globalState.get<boolean>(EMPTY_PROFILE_ONBOARDING_SHOWN_KEY, false);
  if (!shouldShowEmptyProfileOnboarding(profileCount, alreadyShown)) {
    return;
  }

  await context.globalState.update(EMPTY_PROFILE_ONBOARDING_SHOWN_KEY, true);
  await promptToOpenProfileManager(extensionUri, getEmptyProfilePromptDescriptor('onboarding'));
}

export async function ensureProfilesOrPrompt(
  extensionUri: vscode.Uri,
  message: string = t(getEmptyProfilePromptDescriptor('command').messageKey)
): Promise<boolean> {
  if (getProfiles().length > 0) {
    return true;
  }

  const promptDescriptor = getEmptyProfilePromptDescriptor('command');
  await promptToOpenProfileManager(extensionUri, {
    ...promptDescriptor,
    customMessage: message
  });
  return false;
}

async function promptToOpenProfileManager(
  extensionUri: vscode.Uri,
  descriptor: {
    messageKey: string;
    severity: 'info' | 'warning';
    openPanelAction: 'add';
    customMessage?: string;
  }
): Promise<void> {
  const actionLabel = t('openProfileManagerAction');
  const message = descriptor.customMessage || t(descriptor.messageKey);
  const selection = descriptor.severity === 'info'
    ? await vscode.window.showInformationMessage(message, actionLabel)
    : await vscode.window.showWarningMessage(message, actionLabel);

  if (selection === actionLabel) {
    openProfileManagerPanel(extensionUri, descriptor.openPanelAction);
  }
}


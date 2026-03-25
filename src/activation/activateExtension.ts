import * as vscode from 'vscode';

import { showEmptyProfileOnboardingIfNeeded } from '../commands/profileOnboarding';
import { initProfileManager } from '../config/profileManager';
import { t } from '../i18n';
import { registerExtensionCommands } from './commandRegistration';
import { createProfileManagerStatusBarItem } from './statusBar';

export function activateExtension(context: vscode.ExtensionContext): void {
  initProfileManager(context);
  registerExtensionCommands(context);

  const statusBarItem = createProfileManagerStatusBarItem(t('openProfileManagerTooltip'));
  statusBarItem.show();
  context.subscriptions.push(statusBarItem);

  void showEmptyProfileOnboardingIfNeeded(context, context.extensionUri);
}

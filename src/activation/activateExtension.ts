/**
 * AI Commit Lite Extension Activation
 *
 * DESIGN DECISION: The extension activates on "onStartupFinished" (see package.json):
 * - The status bar entry is shown immediately so users always know the extension is installed
 * - The onboarding prompt for empty profile lists appears right after startup
 * - VS Code (>= 1.74) also auto-generates activation events for commands declared in
 *   contributes.commands, so "onCommand:..." declarations are no longer required
 *
 * Tradeoffs:
 * - A small amount of memory/time is used on every VS Code start (lightweight extension)
 * - The profile manager panel itself is still created lazily on first command use
 */
import * as vscode from 'vscode';

import { showEmptyProfileOnboardingIfNeeded } from '../commands/profileOnboarding';
import { initProfileManager } from '../config/profileManager';
import { t } from '../i18n';
import { getOutputChannel } from '../ui/output';
import { registerExtensionCommands } from './commandRegistration';
import { createProfileManagerStatusBarItem } from './statusBar';

export function activateExtension(context: vscode.ExtensionContext): void {
  initProfileManager(context);
  registerExtensionCommands(context);

  const statusBarItem = createProfileManagerStatusBarItem(t('openProfileManagerTooltip'));
  statusBarItem.show();
  context.subscriptions.push(statusBarItem, getOutputChannel());

  void showEmptyProfileOnboardingIfNeeded(context, context.extensionUri);
}

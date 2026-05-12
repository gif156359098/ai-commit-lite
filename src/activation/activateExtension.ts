/**
 * AI Commit Lite Extension Activation
 *
 * DESIGN DECISION: This extension uses "onCommand:ai-commit-lite.generateCommit" activation
 * instead of "onStartupFinished" to reduce VS Code startup time impact.
 *
 * Why now command-based activation:
 * 1. The primary user action is generating commits via SCM menu button or keyboard shortcut
 * 2. Status bar and other UI elements are lazily initialized on first use
 * 3. Onboarding prompts are deferred until user actually tries to use the extension
 * 4. Most users don't need the extension activated when opening VS Code just for reading code
 *
 * Tradeoffs:
 * - Status bar only appears after first command usage (acceptable UX tradeoff)
 * - New users onboarding is delayed until they use generateCommit
 *   (handled by ensureProfilesOrPrompt which prompts before running)
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

import * as vscode from 'vscode';

import {
  CommitGenerationResult,
  generateCommitMessageFromPrepared,
  prepareCommitGeneration
} from '../commit/generator';
import { getActiveProfile, getEffectiveConfig, handleQuotaExceeded } from '../config/profileManager';
import { getConfig, validateConfig } from '../config/settings';
import { checkHasStagedChanges } from '../git/diff';
import { fillSourceControlInputBox } from '../git/scm';
import { t } from '../i18n';
import {
  CommitProgressStage,
  getAutoFallbackSuccessDescriptor,
  getCommitGenerationErrorDescriptor,
  getCommitProgressMessageDescriptor,
  getCommitProgressTitleDescriptor,
  getCommitGenerationSuccessDescriptor,
  getConfigurationErrorDescriptor,
  getUnexpectedCommandErrorDescriptor
} from './commandMessageDescriptors';
import { ensureProfilesForCommand } from './profileCommandGate';
import { isQuotaError } from './quotaError';

let isGenerating = false;

export function generateCommitCommand(extensionUri: vscode.Uri): () => Promise<void> {
  return async () => {
    if (isGenerating) {
      vscode.window.showWarningMessage(t('commitGenerationInProgress'));
      return;
    }

    isGenerating = true;

    try {
      const hasProfiles = await ensureProfilesForCommand(extensionUri);
      if (!hasProfiles) {
        return;
      }

      const activeProfile = getActiveProfile();
      if (!activeProfile) {
        return;
      }

      const hasStagedChanges = await checkHasStagedChanges();

      if (!hasStagedChanges) {
        vscode.window.showWarningMessage(t('noStagedChanges'));
        return;
      }

      const baseConfig = getConfig();
      const validation = validateConfig(baseConfig);

      if (!validation.valid) {
        const errorMessage = validation.errors.join('\n');
        const descriptor = getConfigurationErrorDescriptor(errorMessage);
        vscode.window.showErrorMessage(t(descriptor.key, descriptor.params));
        return;
      }

      await vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: t(getCommitProgressTitleDescriptor().key),
        cancellable: true
      }, async (progress: vscode.Progress<{ increment: number; message: string }>, token: vscode.CancellationToken) => {
        try {
          reportCommitProgress(progress, 'collecting', 20);
          const result = await generateCommitMessageWithAutoFallback(progress, token);

          if (token.isCancellationRequested) {
            return;
          }

          await fillSourceControlInputBox(result.commitMessage);

          reportCommitProgress(progress, 'complete', 100);

          const successDescriptor = getCommitGenerationSuccessDescriptor(result.diffContextReport);

          vscode.window.showInformationMessage(t(successDescriptor.key, successDescriptor.params));
        } catch (error: any) {
          if (token.isCancellationRequested) {
            return;
          }
          const descriptor = getCommitGenerationErrorDescriptor(error.message);
          vscode.window.showErrorMessage(t(descriptor.key, descriptor.params));
        }
      });
    } catch (error: any) {
      const descriptor = getUnexpectedCommandErrorDescriptor(error.message);
      vscode.window.showErrorMessage(t(descriptor.key, descriptor.params));
    } finally {
      isGenerating = false;
    }
  };
}

async function generateCommitMessageWithAutoFallback(
  progress: vscode.Progress<{ increment: number; message: string }>,
  token: vscode.CancellationToken
): Promise<CommitGenerationResult> {
  const attemptedProfileIds = new Set<string>();

  while (true) {
    if (token.isCancellationRequested) {
      throw new Error('Cancelled');
    }

    const config = await getEffectiveConfig();
    const currentProfile = config.profile;
    attemptedProfileIds.add(currentProfile.id);

    const preparedGeneration = await prepareCommitGeneration(config);
    reportCommitProgress(
      progress,
      'requesting',
      attemptedProfileIds.size === 1 ? 35 : 0
    );

    try {
      const abortController = new AbortController();
      token.onCancellationRequested(() => {
        abortController.abort();
        preparedGeneration.provider.cancel();
      });

      return await generateCommitMessageFromPrepared(preparedGeneration, abortController.signal);
    } catch (error: any) {
      if (!isQuotaError(error)) {
        throw error;
      }

      const nextProfile = await handleQuotaExceeded(currentProfile.id);
      if (!nextProfile || attemptedProfileIds.has(nextProfile.id)) {
        throw error;
      }

      const fallbackDescriptor = getAutoFallbackSuccessDescriptor(
        currentProfile.label,
        nextProfile.label
      );
      vscode.window.showInformationMessage(
        t(fallbackDescriptor.key, fallbackDescriptor.params)
      );
    }
  }
}

function reportCommitProgress(
  progress: vscode.Progress<{ increment: number; message: string }>,
  stage: CommitProgressStage,
  increment: number
): void {
  const descriptor = getCommitProgressMessageDescriptor(stage);
  progress.report({ increment, message: t(descriptor.key, descriptor.params) });
}

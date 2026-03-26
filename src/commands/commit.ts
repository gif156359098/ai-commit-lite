import * as vscode from 'vscode';

import { EXTENSION_COMMAND_IDS } from '../activation/extensionManifest';
import { getActiveProfile } from '../config/profileManager';
import { getConfig, validateConfig } from '../config/settings';
import { generationController } from '../core/generationController';
import {
  GenerateCommitResult,
  runGenerateCommitMessage
} from '../core/generateCommitMessage';
import { fillSourceControlInputBox } from '../git/scm';
import { t } from '../i18n';
import { showGenerationFailed } from '../ui/notifications';
import { appendError, appendInfo, appendSummary, showLog } from '../ui/output';
import {
  getSuccessStatusMessage,
  showAlreadyRunningStatus,
  showCancelledStatus,
  showSuccessStatus
} from '../ui/statusBar';
import { getErrorMessage } from '../utils/errors';
import { ensureProfilesForCommand } from './profileCommandGate';

type SuccessfulGenerateCommitResult = Extract<GenerateCommitResult, { type: 'success' }>;

export function generateCommitCommand(extensionUri: vscode.Uri): () => Promise<void> {
  return async (): Promise<void> => {
    try {
      const hasProfiles = await ensureProfilesForCommand(extensionUri);
      if (!hasProfiles) {
        return;
      }

      if (!getActiveProfile()) {
        return;
      }

      const validation = validateConfig(getConfig());
      if (!validation.valid) {
        const errorMessage = validation.errors.join('\n');
        vscode.window.showErrorMessage(t('configurationError', { errors: errorMessage }));
        return;
      }

      const runId = generationController.tryStart();
      if (runId === null) {
        showAlreadyRunningStatus(2500);
        return;
      }

      let finished = false;
      const finish = (): void => {
        if (!finished) {
          generationController.finish(runId);
          finished = true;
        }
      };

      appendInfo('Commit generation started.');

      let progressToken: vscode.CancellationToken | undefined;
      let result: GenerateCommitResult;

      try {
        result = await vscode.window.withProgress({
          location: vscode.ProgressLocation.Notification,
          title: t('generatingCommitMessage'),
          cancellable: true
        }, async (
          progress: vscode.Progress<{ increment: number; message: string }>,
          token: vscode.CancellationToken
        ): Promise<GenerateCommitResult> => {
          progressToken = token;

          return await runGenerateCommitMessage({
            progress,
            token,
            onInfo: appendInfo
          });
        });
      } catch (error: unknown) {
        finish();
        await handleFailureResult(error);
        return;
      }

      if (!progressToken) {
        finish();
        return;
      }

      if (result.type === 'success') {
        await handleSuccessResult(result, progressToken, runId, finish);
        return;
      }

      finish();

      if (result.type === 'cancelled') {
        handleCancelledResult(result.reason);
        return;
      }

      await handleFailureResult(result.error);
    } catch (error: unknown) {
      const message = getErrorMessage(error);
      appendError(`Unexpected command error: ${message}`, error);
      vscode.window.showErrorMessage(t('errorPrefix', { message }));
    }
  };
}

async function handleSuccessResult(
  result: SuccessfulGenerateCommitResult,
  token: vscode.CancellationToken,
  runId: number,
  finish: () => void
): Promise<void> {
  if (token.isCancellationRequested || !generationController.isActive(runId)) {
    finish();
    handleCancelledResult('Cancelled before updating the Source Control input box.');
    return;
  }

  try {
    await fillSourceControlInputBox(result.message);
    appendInfo('Commit message written to the Source Control input box.');
    appendSummary(result.summary);
    showSuccessStatus(getSuccessStatusMessage(result.summary));
    finish();
  } catch (error: unknown) {
    appendSummary(result.summary);
    finish();
    await handleFailureResult(error, 'Failed to update the Source Control input box');
  }
}

function handleCancelledResult(reason?: string): void {
  if (reason) {
    appendInfo(`Commit generation cancelled: ${reason}`);
  } else {
    appendInfo('Commit generation cancelled.');
  }

  showCancelledStatus();
}

async function handleFailureResult(
  error: unknown,
  context: string = 'Commit generation failed'
): Promise<void> {
  const message = getErrorMessage(error);
  appendError(`${context}: ${message}`, error);

  const action = await showGenerationFailed(message);
  if (action === 'viewLog') {
    showLog();
    return;
  }

  if (action === 'retry') {
    await vscode.commands.executeCommand(EXTENSION_COMMAND_IDS.generateCommit);
  }
}

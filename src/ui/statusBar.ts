import * as vscode from 'vscode';

import { GenerationSummary } from '../core/generateCommitMessage';
import { t } from '../i18n';

const DEFAULT_STATUS_TIMEOUT_MS = 3000;

export function showSuccessStatus(message: string, timeout: number = DEFAULT_STATUS_TIMEOUT_MS): void {
  vscode.window.setStatusBarMessage(message, timeout);
}

export function showCancelledStatus(
  message: string = t('aiCommitCancelled'),
  timeout: number = DEFAULT_STATUS_TIMEOUT_MS
): void {
  vscode.window.setStatusBarMessage(message, timeout);
}

export function showAlreadyRunningStatus(timeout: number = DEFAULT_STATUS_TIMEOUT_MS): void {
  vscode.window.setStatusBarMessage(t('aiCommitAlreadyRunning'), timeout);
}

export function getSuccessStatusMessage(summary: GenerationSummary): string {
  const hasOptimization = summary.filteredFiles.length > 0
    || summary.summarizedFiles.length > 0
    || summary.truncatedFiles.length > 0;

  if (!hasOptimization) {
    return t('aiCommitReady');
  }

  return t('aiCommitReadyWithCounts', {
    included: summary.includedFiles.length,
    filtered: summary.filteredFiles.length
  });
}

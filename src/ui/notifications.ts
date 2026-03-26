import * as vscode from 'vscode';

import { t } from '../i18n';

export async function showGenerationFailed(
  message: string
): Promise<'retry' | 'viewLog' | undefined> {
  const retryAction = t('retryAction');
  const viewLogAction = t('viewLogAction');
  const selection = await vscode.window.showErrorMessage(
    t('aiCommitFailed', { message }),
    retryAction,
    viewLogAction
  );

  if (selection === retryAction) {
    return 'retry';
  }

  if (selection === viewLogAction) {
    return 'viewLog';
  }

  return undefined;
}

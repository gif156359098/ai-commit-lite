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
import { GitRepositoryContext, resolveGitRepositoryContext } from '../git/repositoryContext';
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

export function generateCommitCommand(
  extensionUri: vscode.Uri
): (hint?: unknown) => Promise<void> {
  return async (hint?: unknown): Promise<void> => {
    // 生成锁必须对最外层 catch 可见：任何未预料到的异常都不能留下占用中的锁，
    // 否则后续生成请求会被永远挡在外面（需 reload window）。
    let runId: number | null = null;
    let finished = false;
    const finish = (): void => {
      if (!finished) {
        if (runId !== null) {
          generationController.finish(runId);
        }
        finished = true;
      }
    };

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

      // 先占用生成锁再解析仓库：并发触发时第二次调用立即提示"正在运行"，
      // 而不是重复弹出仓库选择器。
      runId = generationController.tryStart();
      if (runId === null) {
        showAlreadyRunningStatus(2500);
        return;
      }

      // 在启动生成前解析一次仓库，后续所有环节复用，避免中途活动编辑器变化导致
      // diff 来源仓库与写回目标仓库不一致。
      let repository: GitRepositoryContext | undefined;
      try {
        repository = await resolveGitRepositoryContext(hint);
      } catch (error: unknown) {
        finish();
        const message = getErrorMessage(error);
        appendError(t('unexpectedCommandError', { message }), error);
        vscode.window.showErrorMessage(t('errorPrefix', { message }));
        return;
      }

      if (!repository) {
        finish();
        appendInfo(t('commitGenerationSkippedNoRepository'));
        return;
      }

      appendInfo(t('commitGenerationStartedForRepository', { repository: repository.root }));

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
            repository,
            token,
            onInfo: appendInfo
          });
        });
      } catch (error: unknown) {
        finish();
        await handleFailureResult(error, repository);
        return;
      }

      if (!progressToken) {
        finish();
        return;
      }

      if (result.type === 'success') {
        await handleSuccessResult(result, repository, progressToken, runId, finish);
        return;
      }

      finish();

      if (result.type === 'cancelled') {
        handleCancelledResult(result.reason);
        return;
      }

      await handleFailureResult(result.error, repository);
    } catch (error: unknown) {
      finish();
      const message = getErrorMessage(error);
      appendError(t('unexpectedCommandError', { message }), error);
      vscode.window.showErrorMessage(t('errorPrefix', { message }));
    }
  };
}

async function handleSuccessResult(
  result: SuccessfulGenerateCommitResult,
  repository: GitRepositoryContext,
  token: vscode.CancellationToken,
  runId: number,
  finish: () => void
): Promise<void> {
  if (token.isCancellationRequested || !generationController.isActive(runId)) {
    finish();
    handleCancelledResult(t('cancelledBeforeUpdatingInputBox'));
    return;
  }

  try {
    await fillSourceControlInputBox(repository, result.message);
    appendInfo(t('commitMessageWrittenToInputBox'));
    appendSummary(result.summary);
    showSuccessStatus(getSuccessStatusMessage(result.summary));
    finish();
  } catch (error: unknown) {
    appendSummary(result.summary);
    finish();
    await handleFailureResult(
      error,
      repository,
      t('failedToUpdateInputBox')
    );
  }
}

function handleCancelledResult(reason?: string): void {
  if (reason) {
    appendInfo(t('commitGenerationCancelledWithReason', { reason }));
  } else {
    appendInfo(t('commitGenerationCancelled'));
  }

  showCancelledStatus();
}

async function handleFailureResult(
  error: unknown,
  repository: GitRepositoryContext,
  context: string = t('commitGenerationFailed')
): Promise<void> {
  const message = getErrorMessage(error);
  appendError(`${context} (${repository.root}): ${message}`, error);

  const action = await showGenerationFailed(message);
  if (action === 'viewLog') {
    showLog();
    return;
  }

  if (action === 'retry') {
    // 传入仓库根路径，避免重试时重新推断甚至再次弹出仓库选择器。
    await vscode.commands.executeCommand(EXTENSION_COMMAND_IDS.generateCommit, repository.root);
  }
}

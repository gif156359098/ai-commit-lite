import * as vscode from 'vscode';

import { getProviderDefinition } from '../ai/providerRegistry';
import {
  PreparedCommitGeneration,
  generateCommitMessageFromPrepared,
  prepareCommitGeneration
} from '../commit/generator';
import {
  getEffectiveConfig,
  getEffectiveConfigForProfile,
  handleProfileFailure
} from '../config/profileManager';
import { checkHasStagedChanges } from '../git/diff';
import { GitRepositoryContext } from '../git/repositoryContext';
import { t } from '../i18n';
import { ModelProfile } from '../types/profile';
import { getCancellationReason, isCancellationError } from '../utils/cancellation';
import { getDetailedErrorInfo, isRetryableError } from '../utils/errors';

export type GenerationSummary = {
  repositoryLabel: string;
  repositoryRoot: string;
  stagedCount: number;
  stagedFiles: string[];
  includedFiles: string[];
  filteredFiles: Array<{ file: string; reason: string }>;
  summarizedFiles: string[];
  truncatedFiles: string[];
  profileLabel: string;
  provider: string;
  model: string;
  promptCharacters: number;
  durationMs: number;
  tokenUsage?: {
    prompt?: number;
    completion?: number;
    total?: number;
  };
};

export type GenerateCommitResult =
  | { type: 'success'; message: string; summary: GenerationSummary }
  | { type: 'cancelled'; reason?: string }
  | { type: 'failure'; error: Error | string };

export interface RunGenerateCommitMessageOptions {
  /** 命令入口解析出的仓库上下文，贯穿暂存检查、diff 抓取与结果写回 */
  repository: GitRepositoryContext;
  progress: vscode.Progress<{ increment: number; message: string }>;
  token: vscode.CancellationToken;
  onInfo?: (message: string) => void;
}

export async function runGenerateCommitMessage(
  options: RunGenerateCommitMessageOptions
): Promise<GenerateCommitResult> {
  const { progress, repository, token, onInfo } = options;
  const startedAt = Date.now();
  const abortController = new AbortController();
  const cancellationSubscription = token.onCancellationRequested(() => {
    abortController.abort(new Error('Request cancelled by user'));
  });

  try {
    if (token.isCancellationRequested) {
      return createCancelledResult(t('cancelledBeforeCollecting'));
    }

    progress.report({ increment: 20, message: t('collectingStagedChanges') });
    const hasStagedChanges = await checkHasStagedChanges(repository.root, abortController.signal);

    if (token.isCancellationRequested || abortController.signal.aborted) {
      return createCancelledResult(t('cancelledWhileCollecting'));
    }

    if (!hasStagedChanges) {
      return {
        type: 'failure',
        error: new Error(t('noStagedChangesInRepository', { repository: repository.label }))
      };
    }

    return await generateWithAutoFallback({
      abortSignal: abortController.signal,
      onInfo,
      progress,
      repository,
      startedAt,
      token
    });
  } catch (error: unknown) {
    if (token.isCancellationRequested || isCancellationError(error) || abortController.signal.aborted) {
      return createCancelledResult(
        getCancellationReason(error, t('cancelledWhileCollecting'))
      );
    }

    return { type: 'failure', error: error instanceof Error ? error : String(error) };
  } finally {
    cancellationSubscription.dispose();
  }
}

interface GenerateWithAutoFallbackOptions {
  abortSignal: AbortSignal;
  onInfo?: (message: string) => void;
  progress: vscode.Progress<{ increment: number; message: string }>;
  repository: GitRepositoryContext;
  startedAt: number;
  token: vscode.CancellationToken;
}

async function generateWithAutoFallback(
  options: GenerateWithAutoFallbackOptions
): Promise<GenerateCommitResult> {
  const { abortSignal, onInfo, progress, repository, startedAt, token } = options;
  const attemptedProfileIds = new Set<string>();
  let fallbackProfileId: string | undefined;

  while (true) {
    if (token.isCancellationRequested || abortSignal.aborted) {
      return createCancelledResult(t('cancelledBeforeAiRequest'));
    }

    const config = fallbackProfileId
      ? await getEffectiveConfigForProfile(fallbackProfileId)
      : await getEffectiveConfig();
    const currentProfile = config.profile;
    attemptedProfileIds.add(currentProfile.id);

    const preparedGeneration = await prepareCommitGeneration(repository.root, config, abortSignal);

    if (token.isCancellationRequested || abortSignal.aborted) {
      return createCancelledResult(t('cancelledBeforeAiRequest'));
    }

    progress.report({
      increment: attemptedProfileIds.size === 1 ? 35 : 0,
      message: t('sendingCommitRequest')
    });

    const providerCancellationSubscription = token.onCancellationRequested(() => {
      preparedGeneration.provider.cancel();
    });

    try {
      const result = await generateCommitMessageFromPrepared(preparedGeneration, abortSignal, onInfo);

      if (token.isCancellationRequested || abortSignal.aborted) {
        return createCancelledResult(t('cancelledAfterAiResponse'));
      }

      return {
        type: 'success',
        message: result.commitMessage,
        summary: buildGenerationSummary(
          preparedGeneration,
          currentProfile,
          repository,
          Date.now() - startedAt
        )
      };
    } catch (error: unknown) {
      if (token.isCancellationRequested || abortSignal.aborted || isCancellationError(error)) {
        return createCancelledResult(
          getCancellationReason(error, t('cancelledWhileGenerating'))
        );
      }

      const errorDetail = getDetailedErrorInfo(error);
      const retryable = isRetryableError(error);
      onInfo?.(t('errorWithProfile', {
        profile: currentProfile.label,
        note: retryable ? '' : t('errorNotRetryableNote'),
        detail: errorDetail
      }));

      const nextProfile = await handleProfileFailure(currentProfile.id, retryable);
      if (!nextProfile || attemptedProfileIds.has(nextProfile.id)) {
        return { type: 'failure', error: error instanceof Error ? error : String(error) };
      }

      fallbackProfileId = nextProfile.id;
      progress.report({
        increment: 0,
        message: t('retryingWithProfile', { profile: nextProfile.label })
      });
      onInfo?.(t('autoFallbackInfo', { oldProfile: currentProfile.label, newProfile: nextProfile.label }));
    } finally {
      providerCancellationSubscription.dispose();
    }
  }
}

function buildGenerationSummary(
  preparedGeneration: PreparedCommitGeneration,
  profile: ModelProfile,
  repository: GitRepositoryContext,
  durationMs: number
): GenerationSummary {
  const provider = getProviderDefinition(profile.provider).label;
  const { files, report } = preparedGeneration.preparedDiff;

  return {
    repositoryLabel: repository.label,
    repositoryRoot: repository.root,
    stagedCount: files.length,
    stagedFiles: files.map((file) => file.path),
    includedFiles: report.includedFiles,
    filteredFiles: report.filteredFiles,
    summarizedFiles: report.summarizedFiles,
    truncatedFiles: report.truncatedFiles,
    profileLabel: profile.label,
    provider,
    model: profile.model,
    promptCharacters: report.totalPromptCharacters,
    durationMs
  };
}

function createCancelledResult(reason?: string): GenerateCommitResult {
  return { type: 'cancelled', reason };
}

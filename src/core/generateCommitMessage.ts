import * as vscode from 'vscode';

import { getProviderDefinition } from '../ai/providerRegistry';
import {
  PreparedCommitGeneration,
  generateCommitMessageFromPrepared,
  prepareCommitGeneration
} from '../commit/generator';
import { getEffectiveConfig, handleProfileFailure } from '../config/profileManager';
import { checkHasStagedChanges } from '../git/diff';
import { t } from '../i18n';
import { ModelProfile } from '../types/profile';
import { getCancellationReason, isCancellationError } from '../utils/cancellation';

export type GenerationSummary = {
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
  progress: vscode.Progress<{ increment: number; message: string }>;
  token: vscode.CancellationToken;
  onInfo?: (message: string) => void;
}

export async function runGenerateCommitMessage(
  options: RunGenerateCommitMessageOptions
): Promise<GenerateCommitResult> {
  const { progress, token, onInfo } = options;
  const startedAt = Date.now();
  const abortController = new AbortController();
  const cancellationSubscription = token.onCancellationRequested(() => {
    abortController.abort(new Error('Request cancelled by user'));
  });

  try {
    if (token.isCancellationRequested) {
      return createCancelledResult('Cancelled before staged changes were collected.');
    }

    progress.report({ increment: 20, message: t('collectingStagedChanges') });
    const hasStagedChanges = await checkHasStagedChanges(abortController.signal);

    if (token.isCancellationRequested || abortController.signal.aborted) {
      return createCancelledResult('Cancelled while collecting staged changes.');
    }

    if (!hasStagedChanges) {
      return { type: 'failure', error: new Error(t('noStagedChanges')) };
    }

    return await generateWithAutoFallback({
      abortSignal: abortController.signal,
      onInfo,
      progress,
      startedAt,
      token
    });
  } catch (error: unknown) {
    if (token.isCancellationRequested || isCancellationError(error) || abortController.signal.aborted) {
      return createCancelledResult(
        getCancellationReason(error, 'Cancelled while collecting staged changes.')
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
  startedAt: number;
  token: vscode.CancellationToken;
}

async function generateWithAutoFallback(
  options: GenerateWithAutoFallbackOptions
): Promise<GenerateCommitResult> {
  const { abortSignal, onInfo, progress, startedAt, token } = options;
  const attemptedProfileIds = new Set<string>();

  while (true) {
    if (token.isCancellationRequested || abortSignal.aborted) {
      return createCancelledResult('Cancelled before the AI request started.');
    }

    const config = await getEffectiveConfig();
    const currentProfile = config.profile;
    attemptedProfileIds.add(currentProfile.id);

    const preparedGeneration = await prepareCommitGeneration(config, abortSignal);

    if (token.isCancellationRequested || abortSignal.aborted) {
      return createCancelledResult('Cancelled before the AI request started.');
    }

    progress.report({
      increment: attemptedProfileIds.size === 1 ? 35 : 0,
      message: t('sendingCommitRequest')
    });

    const providerCancellationSubscription = token.onCancellationRequested(() => {
      preparedGeneration.provider.cancel();
    });

    try {
      const result = await generateCommitMessageFromPrepared(preparedGeneration, abortSignal);

      if (token.isCancellationRequested || abortSignal.aborted) {
        return createCancelledResult('Cancelled after the AI response was received.');
      }

      return {
        type: 'success',
        message: result.commitMessage,
        summary: buildGenerationSummary(
          preparedGeneration,
          currentProfile,
          Date.now() - startedAt
        )
      };
    } catch (error: unknown) {
      if (token.isCancellationRequested || abortSignal.aborted || isCancellationError(error)) {
        return createCancelledResult(
          getCancellationReason(error, 'Cancelled while generating the commit message.')
        );
      }

      const nextProfile = await handleProfileFailure(currentProfile.id);
      if (!nextProfile || attemptedProfileIds.has(nextProfile.id)) {
        return { type: 'failure', error: error instanceof Error ? error : String(error) };
      }

      progress.report({
        increment: 0,
        message: t('retryingWithProfile', { profile: nextProfile.label })
      });
      onInfo?.(`Auto fallback: "${currentProfile.label}" -> "${nextProfile.label}"`);
    } finally {
      providerCancellationSubscription.dispose();
    }
  }
}

function buildGenerationSummary(
  preparedGeneration: PreparedCommitGeneration,
  profile: ModelProfile,
  durationMs: number
): GenerationSummary {
  const provider = getProviderDefinition(profile.provider).label;
  const { files, report } = preparedGeneration.preparedDiff;

  return {
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

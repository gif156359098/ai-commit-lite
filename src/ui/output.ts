import * as vscode from 'vscode';

import { GenerationSummary } from '../core/generateCommitMessage';
import { t } from '../i18n';
import { getErrorMessage } from '../utils/errors';

const OUTPUT_CHANNEL_NAME = 'AI Commit Lite';

let outputChannel: vscode.OutputChannel | undefined;

export function getOutputChannel(): vscode.OutputChannel {
  if (!outputChannel) {
    outputChannel = vscode.window.createOutputChannel(OUTPUT_CHANNEL_NAME);
  }

  return outputChannel;
}

export function appendInfo(message: string): void {
  getOutputChannel().appendLine(`[${new Date().toISOString()}] ${message}`);
}

export function appendError(message: string, error?: unknown): void {
  const channel = getOutputChannel();
  appendInfo(`ERROR: ${message}`);

  if (error instanceof Error) {
    if (error.stack && error.stack.trim().length > 0) {
      channel.appendLine(error.stack);
      return;
    }

    if (error.message !== message) {
      channel.appendLine(error.message);
    }

    return;
  }

  if (error !== undefined) {
    channel.appendLine(getErrorMessage(error));
  }
}

export function appendSummary(summary: GenerationSummary): void {
  const channel = getOutputChannel();
  appendInfo(t('generationSummaryTitle'));
  channel.appendLine(t('summaryRepositoryLine', { label: summary.repositoryLabel, root: summary.repositoryRoot }));
  channel.appendLine(t('summaryProfileLine', { profile: summary.profileLabel }));
  channel.appendLine(t('summaryProviderLine', { provider: summary.provider }));
  channel.appendLine(t('summaryModelLine', { model: summary.model }));
  channel.appendLine(t('summaryDurationLine', { duration: summary.durationMs }));
  channel.appendLine(t('summaryPromptCharactersLine', { count: summary.promptCharacters }));

  if (summary.tokenUsage) {
    channel.appendLine(
      t('summaryTokenUsageLine', {
        prompt: summary.tokenUsage.prompt ?? '[n/a]',
        completion: summary.tokenUsage.completion ?? '[n/a]',
        total: summary.tokenUsage.total ?? '[n/a]'
      })
    );
  }

  appendList(channel, t('summaryStagedFilesLine', { count: summary.stagedCount }), summary.stagedFiles);
  appendList(channel, t('summaryIncludedFilesLine', { count: summary.includedFiles.length }), summary.includedFiles);
  appendFilteredList(channel, summary.filteredFiles);
  appendList(channel, t('summarySummarizedFilesLine', { count: summary.summarizedFiles.length }), summary.summarizedFiles);
  appendList(channel, t('summaryTruncatedFilesLine', { count: summary.truncatedFiles.length }), summary.truncatedFiles);
  channel.appendLine('');
}

export function showLog(): void {
  getOutputChannel().show(false);
}

function appendList(
  channel: vscode.OutputChannel,
  title: string,
  items: string[]
): void {
  channel.appendLine(title);

  if (items.length === 0) {
    channel.appendLine(`- ${t('summaryNoneItem')}`);
    return;
  }

  for (const item of items) {
    channel.appendLine(`- ${item}`);
  }
}

function appendFilteredList(
  channel: vscode.OutputChannel,
  items: Array<{ file: string; reason: string }>
): void {
  channel.appendLine(t('summaryFilteredFilesLine', { count: items.length }));

  if (items.length === 0) {
    channel.appendLine(`- ${t('summaryNoneItem')}`);
    return;
  }

  for (const item of items) {
    channel.appendLine(`- ${item.file} [${item.reason}]`);
  }
}

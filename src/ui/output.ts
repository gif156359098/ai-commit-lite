import * as vscode from 'vscode';

import { GenerationSummary } from '../core/generateCommitMessage';
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
  appendInfo('Generation summary');
  channel.appendLine(`Profile: ${summary.profileLabel}`);
  channel.appendLine(`Provider: ${summary.provider}`);
  channel.appendLine(`Model: ${summary.model}`);
  channel.appendLine(`Duration: ${summary.durationMs}ms`);
  channel.appendLine(`Prompt characters: ${summary.promptCharacters}`);

  if (summary.tokenUsage) {
    channel.appendLine(
      `Token usage: prompt=${summary.tokenUsage.prompt ?? '[n/a]'}, completion=${summary.tokenUsage.completion ?? '[n/a]'}, total=${summary.tokenUsage.total ?? '[n/a]'}`
    );
  }

  appendList(channel, `Staged files (${summary.stagedCount})`, summary.stagedFiles);
  appendList(channel, `Included files (${summary.includedFiles.length})`, summary.includedFiles);
  appendFilteredList(channel, summary.filteredFiles);
  appendList(channel, `Summarized files (${summary.summarizedFiles.length})`, summary.summarizedFiles);
  appendList(channel, `Truncated files (${summary.truncatedFiles.length})`, summary.truncatedFiles);
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
    channel.appendLine('- none');
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
  channel.appendLine(`Filtered files (${items.length})`);

  if (items.length === 0) {
    channel.appendLine('- none');
    return;
  }

  for (const item of items) {
    channel.appendLine(`- ${item.file} [${item.reason}]`);
  }
}

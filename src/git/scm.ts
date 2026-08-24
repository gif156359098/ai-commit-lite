import * as vscode from 'vscode';

import { GitRepositoryContext } from './repositoryContext';

export async function fillSourceControlInputBox(
  repository: GitRepositoryContext,
  message: string
): Promise<void> {
  repository.setCommitInput(message);
  await vscode.commands.executeCommand('workbench.view.scm');
}

import * as vscode from 'vscode';

import { getGitRepository } from './repository';

export async function fillSourceControlInputBox(message: string): Promise<void> {
  const repository = await getGitRepository();
  repository.inputBox.value = message;
  await vscode.commands.executeCommand('workbench.view.scm');
}

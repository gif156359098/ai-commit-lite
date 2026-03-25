import * as vscode from 'vscode';

import { activateExtension } from './activation/activateExtension';

export function activate(context: vscode.ExtensionContext): void {
  activateExtension(context);
}

export function deactivate(): void {}

import * as vscode from 'vscode';

import { generateCommitCommand } from '../commands/commit';
import {
  addProfileCommand,
  deleteProfileCommand,
  editProfileCommand,
  openProfileManagerCommand
} from '../commands/profileManager';
import { switchProfileCommand } from '../commands/switchProfile';
import { EXTENSION_COMMAND_IDS } from './extensionManifest';

interface RuntimeCommandDefinition {
  id: string;
  /**
   * 必须透传实参：VS Code 在点击 `scm/title` 按钮时会把对应的 SourceControl
   * 作为第一个实参传入，这是多仓库场景下定位目标仓库的唯一依据。
   */
  handler: (...args: unknown[]) => unknown;
}

export function registerExtensionCommands(context: vscode.ExtensionContext): void {
  const commandDefinitions = getRuntimeCommandDefinitions(context.extensionUri);
  const disposables = commandDefinitions.map((definition) =>
    vscode.commands.registerCommand(definition.id, (...args: unknown[]) =>
      definition.handler(...args)
    )
  );

  context.subscriptions.push(...disposables);
}

function getRuntimeCommandDefinitions(extensionUri: vscode.Uri): RuntimeCommandDefinition[] {
  return [
    {
      id: EXTENSION_COMMAND_IDS.generateCommit,
      handler: generateCommitCommand(extensionUri)
    },
    {
      id: EXTENSION_COMMAND_IDS.switchProfile,
      handler: switchProfileCommand(extensionUri)
    },
    {
      id: EXTENSION_COMMAND_IDS.openProfileManager,
      handler: openProfileManagerCommand(extensionUri)
    },
    {
      id: EXTENSION_COMMAND_IDS.addProfile,
      handler: addProfileCommand(extensionUri)
    },
    {
      id: EXTENSION_COMMAND_IDS.editProfile,
      handler: editProfileCommand(extensionUri)
    },
    {
      id: EXTENSION_COMMAND_IDS.deleteProfile,
      handler: deleteProfileCommand(extensionUri)
    }
  ];
}

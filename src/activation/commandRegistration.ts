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
  handler: () => unknown;
}

export function registerExtensionCommands(context: vscode.ExtensionContext): void {
  const commandDefinitions = getRuntimeCommandDefinitions(context.extensionUri);
  const disposables = commandDefinitions.map((definition) =>
    vscode.commands.registerCommand(definition.id, definition.handler)
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

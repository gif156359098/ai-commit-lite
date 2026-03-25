import * as vscode from 'vscode';

import {
  ensureProfilesThenOpenProfileManager,
  openProfileManagerPanel
} from './profileCommandGate';

export function openProfileManagerCommand(extensionUri: vscode.Uri): () => void {
  return () => {
    openProfileManagerPanel(extensionUri);
  };
}

export function addProfileCommand(extensionUri: vscode.Uri): () => void {
  return () => {
    openProfileManagerPanel(extensionUri, 'add');
  };
}

export function editProfileCommand(extensionUri: vscode.Uri): () => void {
  return async () => {
    await ensureProfilesThenOpenProfileManager(extensionUri, 'edit');
  };
}

export function deleteProfileCommand(extensionUri: vscode.Uri): () => void {
  return async () => {
    await ensureProfilesThenOpenProfileManager(extensionUri, 'delete');
  };
}

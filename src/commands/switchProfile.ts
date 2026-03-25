import * as vscode from 'vscode';
import { getProviderDefinition } from '../ai/providerRegistry';
import { getProfiles, getActiveProfile, switchProfile } from '../config/profileManager';
import { t } from '../i18n';
import {
  getProfileSwitchErrorDescriptor,
  getProfileSwitchSuccessDescriptor
} from './commandMessageDescriptors';
import { ensureProfilesForCommand } from './profileCommandGate';

export function switchProfileCommand(extensionUri: vscode.Uri): () => Promise<void> {
  return async () => {
    const hasProfiles = await ensureProfilesForCommand(extensionUri);
    if (!hasProfiles) {
      return;
    }

    const profiles = getProfiles();
    const activeProfile = getActiveProfile();

    const selected = await vscode.window.showQuickPick(
      profiles.map((p) => ({
        label: p.label,
        description: `${getProviderDefinition(p.provider).label} / ${p.model}`,
        detail: activeProfile?.id === p.id ? t('currentProfile') : undefined,
        profile: p
      })),
      {
        placeHolder: t('selectProfile'),
        ignoreFocusOut: true
      }
    );

    if (!selected) {
      return;
    }

    try {
      await switchProfile(selected.profile.id);
      const successDescriptor = getProfileSwitchSuccessDescriptor(selected.profile.label);
      vscode.window.showInformationMessage(t(successDescriptor.key, successDescriptor.params));
    } catch (error: any) {
      const descriptor = getProfileSwitchErrorDescriptor(error.message);
      vscode.window.showErrorMessage(t(descriptor.key, descriptor.params));
    }
  };
}

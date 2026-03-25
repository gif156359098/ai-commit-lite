import * as vscode from 'vscode';

import {
  getProviderDefinitions
} from '../ai/providerRegistry';
import {
  addProfile,
  deleteProfile,
  getActiveProfile,
  getProfiles,
  hasProfileApiKey,
  storeProfileApiKey,
  switchProfile,
  updateProfile
} from '../config/profileManager';
import { getLocale, t } from '../i18n';
import {
  buildProfileManagerPanelWebviewData,
  buildI18n,
  buildWebviewHtml,
  toPanelProviderView
} from './profileManagerPanelView';
import {
  LocalizedMessageDescriptor,
  getProfileDeleteErrorDescriptor,
  getProfileSaveErrorDescriptor,
  getProfileSwitchErrorDescriptor,
} from './commandMessageDescriptors';
import {
  deleteProfileById,
  getDeleteProfileConfirmation,
  getProfileManagerPanelOperationErrorDescriptor,
  ProfileManagerPanelOperationDeps,
  saveProfileFromForm,
  switchProfileById
} from './profileManagerPanelOperations';
import {
  ProfileFormData,
  ProfileManagerPanelAction
} from './profileManagerPanelTypes';
import { PROFILE_MANAGER_PANEL_ICON_PATHS } from './profileManagerPanelIconPaths';

const profileManagerPanelOperationDeps: ProfileManagerPanelOperationDeps = {
  getProfiles,
  addProfile,
  updateProfile,
  deleteProfile,
  switchProfile,
  hasProfileApiKey,
  storeProfileApiKey,
  now: () => Date.now()
};

export class ProfileManagerPanel {
  public static currentPanel: ProfileManagerPanel | undefined;
  public static readonly viewType = 'aiCommitLite.profileManager';

  private readonly panel: vscode.WebviewPanel;
  private readonly disposables: vscode.Disposable[] = [];
  private pendingAction: ProfileManagerPanelAction;

  public static createOrShow(
    extensionUri: vscode.Uri,
    action: ProfileManagerPanelAction = 'default'
  ): void {
    const column = vscode.ViewColumn.One;

    if (ProfileManagerPanel.currentPanel) {
      ProfileManagerPanel.currentPanel.pendingAction = action;
      ProfileManagerPanel.currentPanel.panel.reveal(column);
      void ProfileManagerPanel.currentPanel.update();
      return;
    }

    const panel = vscode.window.createWebviewPanel(
      ProfileManagerPanel.viewType,
      t('profileManagerTitle'),
      column,
      {
        enableScripts: true,
        localResourceRoots: [extensionUri]
      }
    );
    panel.iconPath = {
      light: vscode.Uri.joinPath(extensionUri, ...PROFILE_MANAGER_PANEL_ICON_PATHS.light),
      dark: vscode.Uri.joinPath(extensionUri, ...PROFILE_MANAGER_PANEL_ICON_PATHS.dark)
    };

    ProfileManagerPanel.currentPanel = new ProfileManagerPanel(panel, action);
  }

  private constructor(panel: vscode.WebviewPanel, initialAction: ProfileManagerPanelAction) {
    this.panel = panel;
    this.pendingAction = initialAction;

    void this.update();

    this.panel.onDidDispose(() => this.dispose(), null, this.disposables);
    this.panel.webview.onDidReceiveMessage(
      async (message: { command?: string; data?: ProfileFormData; profileId?: string }) => {
        switch (message.command) {
          case 'saveProfile':
            if (message.data) {
              await this.handleSaveProfile(message.data);
            }
            break;
          case 'deleteProfile':
            if (message.profileId) {
              await this.handleDeleteProfile(message.profileId);
            }
            break;
          case 'switchProfile':
            if (message.profileId) {
              await this.handleSwitchProfile(message.profileId);
            }
            break;
          default:
            break;
        }
      },
      null,
      this.disposables
    );
  }

  public dispose(): void {
    ProfileManagerPanel.currentPanel = undefined;
    this.panel.dispose();

    while (this.disposables.length > 0) {
      this.disposables.pop()?.dispose();
    }
  }

  private async handleSaveProfile(data: ProfileFormData): Promise<void> {
    await this.runPanelOperation(
      () => saveProfileFromForm(data, profileManagerPanelOperationDeps),
      getProfileSaveErrorDescriptor
    );
  }

  private async handleDeleteProfile(profileId: string): Promise<void> {
    const confirmation = getDeleteProfileConfirmation(profileId, profileManagerPanelOperationDeps);
    if (!confirmation) {
      return;
    }

    const confirmLabel = t(
      confirmation.confirmActionDescriptor.key,
      confirmation.confirmActionDescriptor.params
    );
    const confirm = await vscode.window.showWarningMessage(
      t(confirmation.warningDescriptor.key, confirmation.warningDescriptor.params),
      { modal: true },
      confirmLabel
    );

    if (confirm !== confirmLabel) {
      return;
    }

    await this.runPanelOperation(
      () => deleteProfileById(profileId, profileManagerPanelOperationDeps),
      getProfileDeleteErrorDescriptor
    );
  }

  private async handleSwitchProfile(profileId: string): Promise<void> {
    await this.runPanelOperation(
      () => switchProfileById(profileId, profileManagerPanelOperationDeps),
      getProfileSwitchErrorDescriptor
    );
  }

  private async update(): Promise<void> {
    this.panel.title = t('profileManagerTitle');
    const profiles = getProfiles();
    const i18n = buildI18n(profiles.length);
    const activeProfile = getActiveProfile();
    const providers = getProviderDefinitions().map((provider) => toPanelProviderView(provider));
    const webviewData = await buildProfileManagerPanelWebviewData({
      cspSource: this.panel.webview.cspSource,
      locale: getLocale(),
      activeProfile,
      initialAction: this.pendingAction,
      i18n,
      providers,
      profiles,
      hasProfileApiKey
    });

    this.panel.webview.html = buildWebviewHtml(webviewData);
  }

  private async runPanelOperation(
    operation: () => Promise<LocalizedMessageDescriptor>,
    fallbackDescriptorFactory: (message: string) => LocalizedMessageDescriptor
  ): Promise<void> {
    try {
      const successDescriptor = await operation();
      this.pendingAction = 'default';
      vscode.window.showInformationMessage(t(successDescriptor.key, successDescriptor.params));
      await this.update();
    } catch (error: unknown) {
      const descriptor = getProfileManagerPanelOperationErrorDescriptor(
        error,
        fallbackDescriptorFactory
      );
      vscode.window.showErrorMessage(t(descriptor.key, descriptor.params));
    }
  }
}


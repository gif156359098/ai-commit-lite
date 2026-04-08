import * as vscode from 'vscode';

import {
  getProviderDefinitions
} from '../ai/providerRegistry';
import {
  addProfile,
  clearFallbackPriority,
  deleteProfile,
  getActiveProfile,
  getProfileConfig,
  getProfiles,
  hasProfileApiKey,
  moveFallbackProfile,
  prioritizeFallbackProfile,
  storeProfileApiKey,
  switchProfile,
  updateProfile
} from '../config/profileManager';
import { FallbackMoveDirection } from '../config/profileManagerHelpers';
import { readAICommitConfigValue, updateAICommitConfigValue } from '../config/workspaceConfig';
import { getLocale, t } from '../i18n';
import {
  buildProfileManagerPanelWebviewData,
  buildI18n,
  buildWebviewHtml,
  toPanelProviderView,
  LANGUAGE_OPTIONS
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

interface ProfileManagerPanelMessage {
  command?: string;
  data?: ProfileFormData;
  profileId?: string;
  language?: string;
  direction?: FallbackMoveDirection;
}

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
      async (message: ProfileManagerPanelMessage) => {
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
          case 'prioritizeFallbackProfile':
            if (message.profileId) {
              await this.handlePrioritizeFallbackProfile(message.profileId);
            }
            break;
          case 'moveFallbackProfile':
            if (message.profileId && message.direction) {
              await this.handleMoveFallbackProfile(message.profileId, message.direction);
            }
            break;
          case 'clearFallbackPriority':
            if (message.profileId) {
              await this.handleClearFallbackPriority(message.profileId);
            }
            break;
          case 'openSettings':
            await this.handleOpenSettings();
            break;
          case 'updateLanguage':
            if (message.language) {
              await this.handleUpdateLanguage(message.language);
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

  private async handlePrioritizeFallbackProfile(profileId: string): Promise<void> {
    await this.runFallbackOrderOperation(() => prioritizeFallbackProfile(profileId));
  }

  private async handleMoveFallbackProfile(
    profileId: string,
    direction: FallbackMoveDirection
  ): Promise<void> {
    await this.runFallbackOrderOperation(() => moveFallbackProfile(profileId, direction));
  }

  private async handleClearFallbackPriority(profileId: string): Promise<void> {
    await this.runFallbackOrderOperation(() => clearFallbackPriority(profileId));
  }

  private async handleOpenSettings(): Promise<void> {
    await vscode.commands.executeCommand('workbench.action.openSettings', 'aiCommitLite');
  }

  private async handleUpdateLanguage(language: string): Promise<void> {
    await updateAICommitConfigValue('language', language);
    await this.update();
  }

  private async update(): Promise<void> {
    this.panel.title = t('profileManagerTitle');
    const profileConfig = getProfileConfig();
    const profiles = profileConfig.profiles;
    const i18n = buildI18n(profiles.length);
    const activeProfile = getActiveProfile();
    const providers = getProviderDefinitions().map((provider) => toPanelProviderView(provider));
    const currentLanguage = readAICommitConfigValue('language', 'en');
    const webviewData = await buildProfileManagerPanelWebviewData({
      cspSource: this.panel.webview.cspSource,
      locale: getLocale(),
      activeProfile,
      initialAction: this.pendingAction,
      i18n,
      providers,
      profiles,
      hasProfileApiKey,
      currentLanguage,
      languageOptions: LANGUAGE_OPTIONS,
      autoFallbackEnabled: profileConfig.enableAutoFallback,
      profileFallbackOrder: profileConfig.profileFallbackOrder
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

  private async runFallbackOrderOperation(operation: () => Promise<void>): Promise<void> {
    try {
      await operation();
      this.pendingAction = 'default';
      await this.update();
    } catch (error: unknown) {
      const descriptor = getProfileManagerPanelOperationErrorDescriptor(
        error,
        (message: string) => ({
          key: 'failedToUpdateFallbackOrder',
          params: { message }
        })
      );
      void this.panel.webview.postMessage({ command: 'fallbackActionSettled' });
      vscode.window.showErrorMessage(t(descriptor.key, descriptor.params));
    }
  }
}
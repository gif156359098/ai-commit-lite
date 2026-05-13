import * as vscode from 'vscode';

import {
  getProviderDefinitions
} from '../ai/providerRegistry';
import {
  addProfile,
  clearFallbackPriority,
  deleteProfile,
  getActiveProfile,
  getProfileApiKey,
  getProfileConfig,
  getProfiles,
  hasProfileApiKey,
  moveFallbackProfile,
  prioritizeFallbackProfile,
  reorderFallbackProfiles,
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
  getProfileDeleteErrorDescriptor,
  getProfileSaveErrorDescriptor,
  getProfileSwitchErrorDescriptor,
} from './commandMessageDescriptors';
import {
  deleteProfileById,
  getProfileManagerPanelOperationErrorDescriptor,
  ProfileManagerPanelOperationDeps,
  saveProfileFromForm,
  switchProfileById
} from './profileManagerPanelOperations';
import {
  testProfileConnection,
  showTestErrorNotification
} from './profileConnectionTester';
import {
  ProfileFormData,
  ProfileManagerPanelAction,
  BuildWebviewHtmlData
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
  newOrder?: string[];
}

export class ProfileManagerPanel {
  public static currentPanel: ProfileManagerPanel | undefined;
  public static readonly viewType = 'aiCommitLite.profileManager';

  private readonly panel: vscode.WebviewPanel;
  private readonly extensionUri: vscode.Uri;
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
      void ProfileManagerPanel.currentPanel.pushStateUpdate();
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

    ProfileManagerPanel.currentPanel = new ProfileManagerPanel(panel, extensionUri, action);
  }

  private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri, initialAction: ProfileManagerPanelAction) {
    this.panel = panel;
    this.extensionUri = extensionUri;
    this.pendingAction = initialAction;

    void this.renderInitialHtml();

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
        case 'reorderFallbackProfiles':
          if (message.newOrder) {
            await this.handleReorderFallbackProfiles(message.newOrder);
          }
          break;
          case 'openSettings':
            await this.handleOpenSettings();
            break;
          case 'testProfile':
            if (message.profileId) {
              await this.handleTestProfile(message.profileId);
            }
            break;
          case 'copyProfile':
            if (message.profileId) {
              await this.handleCopyProfile(message.profileId);
            }
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
    try {
      const successDescriptor = await saveProfileFromForm(data, profileManagerPanelOperationDeps);
      this.pendingAction = 'default';
      vscode.window.showInformationMessage(t(successDescriptor.key, successDescriptor.params));
      await this.pushStateUpdate();
      void this.panel.webview.postMessage({ command: 'profileSaved' });
    } catch (error: unknown) {
      const descriptor = getProfileManagerPanelOperationErrorDescriptor(
        error,
        getProfileSaveErrorDescriptor
      );
      vscode.window.showErrorMessage(t(descriptor.key, descriptor.params));
    }
  }

  private async handleDeleteProfile(profileId: string): Promise<void> {
    try {
      const successDescriptor = await deleteProfileById(profileId, profileManagerPanelOperationDeps);
      this.pendingAction = 'default';
      vscode.window.showInformationMessage(t(successDescriptor.key, successDescriptor.params));
      await this.pushStateUpdate();
    } catch (error: unknown) {
      const descriptor = getProfileManagerPanelOperationErrorDescriptor(
        error,
        getProfileDeleteErrorDescriptor
      );
      vscode.window.showErrorMessage(t(descriptor.key, descriptor.params));
    }
  }

  private async handleSwitchProfile(profileId: string): Promise<void> {
    try {
      await switchProfileById(profileId, profileManagerPanelOperationDeps);
      this.pendingAction = 'default';
      await this.pushStateUpdate();
    } catch (error: unknown) {
      const descriptor = getProfileManagerPanelOperationErrorDescriptor(
        error,
        getProfileSwitchErrorDescriptor
      );
      vscode.window.showErrorMessage(t(descriptor.key, descriptor.params));
    }
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

  private async handleReorderFallbackProfiles(newOrder: string[]): Promise<void> {
    await this.runFallbackOrderOperation(() => reorderFallbackProfiles(newOrder));
  }

  private async handleOpenSettings(): Promise<void> {
    await vscode.commands.executeCommand('workbench.action.openSettings', 'aiCommitLite');
  }

  private async handleTestProfile(profileId: string): Promise<void> {
    const profile = getProfiles().find((p) => p.id === profileId);
    const result = await testProfileConnection(profileId);

    void this.panel.webview.postMessage({
      command: 'testResult',
      profileId,
      success: result.success,
      latencyMs: result.latencyMs
    });

    if (!result.success && result.errorMessage) {
      showTestErrorNotification(profile?.label || profileId, result.errorMessage);
    }
  }

  private async handleCopyProfile(profileId: string): Promise<void> {
    try {
      const profiles = getProfiles();
      const source = profiles.find(p => p.id === profileId);
      if (!source) {
        vscode.window.showErrorMessage('Profile not found');
        return;
      }
      const apiKey = await getProfileApiKey(profileId);
      void this.panel.webview.postMessage({
        command: 'copyProfileData',
        formData: {
          provider: source.provider,
          baseUrl: source.baseUrl || '',
          apiKey: apiKey || ''
        }
      });
    } catch (error: unknown) {
      vscode.window.showErrorMessage(
        `Failed to copy profile: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  private async handleUpdateLanguage(language: string): Promise<void> {
    await updateAICommitConfigValue('language', language);
    await this.pushStateUpdate();
  }

  private async renderInitialHtml(): Promise<void> {
    this.panel.title = t('profileManagerTitle');
    const webviewData = await this.buildWebviewData();
    const scriptUri = this.panel.webview.asWebviewUri(
      vscode.Uri.joinPath(this.extensionUri, 'out', 'webview', 'profileManager.js')
    );
    this.panel.webview.html = buildWebviewHtml(webviewData, scriptUri.toString());
  }

  private async pushStateUpdate(): Promise<void> {
    this.panel.title = t('profileManagerTitle');
    const webviewData = await this.buildWebviewData();
    void this.panel.webview.postMessage({ command: 'stateUpdate', state: webviewData });
  }

  private async buildWebviewData(): Promise<BuildWebviewHtmlData> {
    const profileConfig = getProfileConfig();
    const profiles = profileConfig.profiles;
    const i18n = buildI18n(profiles.length);
    const activeProfile = getActiveProfile();
    const providers = getProviderDefinitions().map((provider) => toPanelProviderView(provider));
    const currentLanguage = readAICommitConfigValue('language', 'en');
    return await buildProfileManagerPanelWebviewData({
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
  }

  private async runFallbackOrderOperation(operation: () => Promise<void>): Promise<void> {
    try {
      await operation();
      this.pendingAction = 'default';
      await this.pushStateUpdate();
      void this.panel.webview.postMessage({ command: 'fallbackActionSettled' });
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

export const EXTENSION_COMMAND_IDS = {
  generateCommit: 'ai-commit-lite.generateCommit',
  switchProfile: 'ai-commit-lite.switchProfile',
  openProfileManager: 'ai-commit-lite.openProfileManager',
  addProfile: 'ai-commit-lite.addProfile',
  editProfile: 'ai-commit-lite.editProfile',
  deleteProfile: 'ai-commit-lite.deleteProfile'
} as const;

export const EXTENSION_COMMAND_ID_LIST = [
  EXTENSION_COMMAND_IDS.generateCommit,
  EXTENSION_COMMAND_IDS.switchProfile,
  EXTENSION_COMMAND_IDS.openProfileManager,
  EXTENSION_COMMAND_IDS.addProfile,
  EXTENSION_COMMAND_IDS.editProfile,
  EXTENSION_COMMAND_IDS.deleteProfile
] as const;

export const PROFILE_MANAGER_STATUS_BAR_DESCRIPTOR = {
  id: 'ai-commit-lite.profileManagerStatusBar',
  name: 'AI Commit Lite',
  text: '$(ai-commit-lite-status-bar) AI Commit Lite',
  command: EXTENSION_COMMAND_IDS.openProfileManager
} as const;


import { ProfileManagerPanelAction } from './profileManagerPanelTypes';

export type ProfileManagerInitialAction = 'add' | 'default';
export type EmptyProfilePromptVariant = 'onboarding' | 'command';

export interface EmptyProfilePromptDescriptor {
  messageKey: 'emptyProfileOnboardingMessage' | 'emptyProfileCommandPrompt';
  severity: 'info' | 'warning';
  openPanelAction: 'add';
}

export function getProfileManagerInitialAction(profileCount: number): ProfileManagerInitialAction {
  return profileCount === 0 ? 'add' : 'default';
}

export function resolveProfileManagerPanelAction(
  profileCount: number,
  requestedAction: ProfileManagerPanelAction = 'default'
): ProfileManagerPanelAction {
  return requestedAction === 'default'
    ? getProfileManagerInitialAction(profileCount)
    : requestedAction;
}

export function shouldShowEmptyProfileOnboarding(
  profileCount: number,
  alreadyShown: boolean
): boolean {
  return profileCount === 0 && !alreadyShown;
}

export function getEmptyProfilePromptDescriptor(
  variant: EmptyProfilePromptVariant
): EmptyProfilePromptDescriptor {
  return variant === 'onboarding'
    ? {
      messageKey: 'emptyProfileOnboardingMessage',
      severity: 'info',
      openPanelAction: 'add'
    }
    : {
      messageKey: 'emptyProfileCommandPrompt',
      severity: 'warning',
      openPanelAction: 'add'
    };
}

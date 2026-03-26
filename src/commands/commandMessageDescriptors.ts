import type { DiffContextReport } from '../git/diff';

export interface LocalizedMessageDescriptor {
  key: string;
  params?: Record<string, string | number>;
}

export type CommitProgressStage = 'collecting' | 'requesting' | 'complete';

export function getCommitGenerationSuccessDescriptor(
  report: DiffContextReport
): LocalizedMessageDescriptor {
  if (!hasDiffContextOptimization(report)) {
    return { key: 'commitMessageFilled' };
  }

  return {
    key: 'commitMessageFilledOptimized',
    params: {
      filtered: report.filteredFiles.length,
      truncated: report.truncatedFiles.length,
      summarized: report.summarizedFiles.length
    }
  };
}

export function getAutoFallbackSuccessDescriptor(
  oldProfile: string,
  newProfile: string
): LocalizedMessageDescriptor {
  return {
    key: 'autoFallbackSuccess',
    params: {
      oldProfile,
      newProfile
    }
  };
}

export function getProfileSaveSuccessDescriptor(
  isNew: boolean,
  label: string
): LocalizedMessageDescriptor {
  return {
    key: isNew ? 'profileAdded' : 'profileUpdated',
    params: { label }
  };
}

export function getProfileDeleteSuccessDescriptor(label: string): LocalizedMessageDescriptor {
  return {
    key: 'profileDeleted',
    params: { label }
  };
}

export function getProfileSwitchSuccessDescriptor(profile: string): LocalizedMessageDescriptor {
  return {
    key: 'profileSwitched',
    params: { profile }
  };
}

export function getCommitProgressTitleDescriptor(): LocalizedMessageDescriptor {
  return { key: 'generatingCommitMessage' };
}

export function getCommitProgressMessageDescriptor(
  stage: CommitProgressStage
): LocalizedMessageDescriptor {
  switch (stage) {
    case 'collecting':
      return { key: 'collectingStagedChanges' };
    case 'requesting':
      return { key: 'sendingCommitRequest' };
    case 'complete':
      return { key: 'complete' };
    default: {
      const exhaustiveCheck: never = stage;
      return exhaustiveCheck;
    }
  }
}

export function getConfigurationErrorDescriptor(errors: string): LocalizedMessageDescriptor {
  return {
    key: 'configurationError',
    params: { errors }
  };
}

export function getCommitGenerationErrorDescriptor(message: string): LocalizedMessageDescriptor {
  return {
    key: 'failedToGenerateCommitMessage',
    params: { message }
  };
}

export function getUnexpectedCommandErrorDescriptor(message: string): LocalizedMessageDescriptor {
  return {
    key: 'errorPrefix',
    params: { message }
  };
}

export function getProfileSaveErrorDescriptor(message: string): LocalizedMessageDescriptor {
  return {
    key: 'failedToSaveProfile',
    params: { message }
  };
}

export function getProfileDeleteErrorDescriptor(message: string): LocalizedMessageDescriptor {
  return {
    key: 'failedToDeleteProfile',
    params: { message }
  };
}

export function getProfileSwitchErrorDescriptor(message: string): LocalizedMessageDescriptor {
  return {
    key: 'failedToSwitchProfile',
    params: { message }
  };
}

export function hasDiffContextOptimization(report: DiffContextReport): boolean {
  return report.filteredFiles.length > 0
    || report.truncatedFiles.length > 0
    || report.summarizedFiles.length > 0;
}

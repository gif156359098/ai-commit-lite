import Sortable from 'sortablejs';
import morphdom from 'morphdom';

interface WebviewState {
  activeProfileId: string;
  activeProfileLabel: string;
  initialAction: string;
  i18n: Record<string, string>;
  providers: ProviderView[];
  profiles: ProfileView[];
  currentLanguage: string;
  languageOptions: LanguageOption[];
  autoFallbackEnabled: boolean;
}

interface ProviderView {
  type: string;
  label: string;
  description: string;
  audienceHint: string;
  endpointHint: string;
  defaultModel: string;
  modelPlaceholder: string;
  modelInputKind: string;
  baseUrlMode: string;
  defaultBaseUrl: string;
  baseUrlPlaceholder: string;
}

interface ProfileView {
  id: string;
  label: string;
  provider: string;
  model: string;
  baseUrl?: string;
  hasApiKey: boolean;
  providerLabel: string;
  providerDescription: string;
  providerAudienceHint: string;
  endpointHint: string;
  fallbackPriority: number | null;
  hasExplicitFallbackPriority: boolean;
  isSkippedWhileActive: boolean;
}

interface LanguageOption {
  value: string;
  label: string;
}

declare function acquireVsCodeApi(): VsCodeApi;

interface VsCodeApi {
  postMessage(message: unknown): void;
}

const vscode = acquireVsCodeApi();
const state = (window as unknown as { state: WebviewState }).state;

const providerMap: Record<string, ProviderView> = Object.fromEntries(
  state.providers.map((provider) => [provider.type, provider])
);

const updateProviderMap = (): void => {
  for (const key of Object.keys(providerMap)) {
    delete providerMap[key];
  }
  state.providers.forEach((provider) => { providerMap[provider.type] = provider; });
};

const $ = (id: string): HTMLElement =>
  document.getElementById(id) as HTMLElement;

const escapeText = (value: string | undefined): string => {
  const div = document.createElement('div');
  div.textContent = value || '';
  return div.innerHTML;
};

const getProfileById = (profileId: string): ProfileView | undefined =>
  state.profiles.find((profile) => profile.id === profileId);

const getEditingProfile = (): ProfileView | undefined =>
  ($('profileId') as HTMLInputElement).value
    ? getProfileById(($('profileId') as HTMLInputElement).value)
    : undefined;

const getSelectedProvider = (): ProviderView =>
  providerMap[($('provider') as HTMLInputElement).value] || state.providers[0];

const getRequiredLabel = (label: string, required: boolean): string =>
  required ? `${label} *` : label;

const setBanner = (message: string): void => {
  $('actionBanner').textContent = message || '';
  $('actionBanner').classList.toggle('active', Boolean(message));
};

const setFormError = (message: string): void => {
  $('formError').textContent = message || '';
  $('formError').classList.toggle('active', Boolean(message));
};

const openModal = (): void => {
  $('formModal').classList.add('active');
  $('formModal').setAttribute('aria-hidden', 'false');
  $('label').focus();
};

const hideForm = (): void => {
  $('formModal').classList.remove('active');
  $('formModal').setAttribute('aria-hidden', 'true');
  setFormError('');
};

let fallbackBusy = false;
let activeSortable: Sortable | null = null;
let availableSortable: Sortable | null = null;
let pendingDeleteProfileId: string | undefined;

const formatDeleteConfirmMessage = (profile: ProfileView): string =>
  state.i18n.profileDeleteConfirm.replace('{label}', () => profile.label);

const showDeleteConfirm = (profileId: string): void => {
  const profile = getProfileById(profileId);
  if (!profile) {
    return;
  }

  pendingDeleteProfileId = profile.id;
  $('deleteConfirmMessage').textContent = formatDeleteConfirmMessage(profile);
  $('deleteConfirmProfileName').textContent = profile.label;
  $('deleteConfirmProfileMeta').textContent = `${profile.providerLabel} / ${profile.model}`;
  $('deleteConfirmModal').classList.add('active');
  $('deleteConfirmModal').setAttribute('aria-hidden', 'false');
  $('cancelDeleteButton').focus();
};

const hideDeleteConfirm = (): void => {
  pendingDeleteProfileId = undefined;
  $('deleteConfirmModal').classList.remove('active');
  $('deleteConfirmModal').setAttribute('aria-hidden', 'true');
};

const confirmDeleteProfile = (): void => {
  const profileId = pendingDeleteProfileId;
  if (!profileId) {
    return;
  }

  hideDeleteConfirm();
  vscode.postMessage({ command: 'deleteProfile', profileId });
};

const syncFallbackControlState = (): void => {
  document
    .querySelectorAll(
      '[data-action="clearFallbackPriority"], [data-action="prioritizeFallback"]'
    )
    .forEach((button) => {
      (button as HTMLButtonElement).disabled = fallbackBusy;
    });
};

const setFallbackBusy = (busy: boolean): void => {
  fallbackBusy = busy;
  syncFallbackControlState();
  if (activeSortable) {
    activeSortable.option('disabled', busy);
  }
  if (availableSortable) {
    availableSortable.option('disabled', busy);
  }
};

const postFallbackAction = (message: Record<string, unknown>): void => {
  if (fallbackBusy) {
    return;
  }
  setFallbackBusy(true);
  vscode.postMessage(message);
};

interface TestCardState {
  status: 'idle' | 'testing' | 'success' | 'error';
  latencyMs?: number;
  dismissTimer?: ReturnType<typeof setTimeout>;
}

const testStates = new Map<string, TestCardState>();

function clearTestState(profileId: string): void {
  const existing = testStates.get(profileId);
  if (existing?.dismissTimer) {
    clearTimeout(existing.dismissTimer);
  }
  testStates.delete(profileId);
}

function clearAllTestStates(): void {
  for (const [profileId] of testStates) {
    clearTestState(profileId);
  }
}

const icons = {
  check:
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>',
  edit:
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>',
  trash:
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>',
  star:
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>',
  bolt:
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>',
  checkSmall:
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>',
  xSmall:
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>'
};

function renderFallbackPanel(): void {
  const panelTitle = $('fallbackPanelTitle');
  const activeLabel = $('fallbackActiveLabel');
  const availableLabel = $('fallbackAvailableLabel');
  const activeList = $('fallbackActiveList');
  const availableList = $('fallbackAvailableList');
  const activeZone = $('fallbackActiveZone');
  const availableZone = $('fallbackAvailableZone');
  if (!panelTitle || !activeList || !availableList) {
    return;
  }

  if (state.profiles.length < 2) {
    panelTitle.textContent = '';
    activeZone.style.display = 'none';
    availableZone.style.display = 'none';
    return;
  }

  panelTitle.textContent = state.i18n.fallbackPanelTitle;
  activeLabel.textContent = state.i18n.fallbackActiveLabel;
  availableLabel.textContent = state.i18n.fallbackAvailableLabel;

  const explicitProfiles = state.profiles
    .filter((p) => p.hasExplicitFallbackPriority)
    .sort((a, b) => {
      const aActive = a.id === state.activeProfileId ? 0 : 1;
      const bActive = b.id === state.activeProfileId ? 0 : 1;
      if (aActive !== bActive) {
        return aActive - bActive;
      }
      return (a.fallbackPriority ?? 0) - (b.fallbackPriority ?? 0);
    });
  const defaultProfiles = state.profiles.filter(
    (p) => !p.hasExplicitFallbackPriority
  );

  const removeIcon =
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>';
  const addIcon =
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>';

  morphdom(activeList, '<div>' + explicitProfiles
    .map((profile, index) => {
      const isActive = state.activeProfileId === profile.id;
      const classes = ['fallback-chip'];
      if (isActive) {
        classes.push('active', 'no-drag');
      }
      return '<div class="' + classes.join(' ') + '" data-fallback-chip="true" data-profile-id="' + escapeText(profile.id) + '">'
        + '<span class="fallback-chip-rank">#' + (index + 1) + '</span>'
        + '<span class="fallback-chip-label">' + escapeText(profile.label) + '</span>'
        + '<span class="fallback-chip-provider">' + escapeText(profile.providerLabel) + '</span>'
        + (isActive ? '<span class="fallback-chip-badge">' + escapeText(state.i18n.fallbackChipActive) + '</span>' : '')
        + (!isActive ? '<button class="fallback-chip-btn" data-action="clearFallbackPriority" data-profile-id="' + escapeText(profile.id) + '" title="' + escapeText(state.i18n.removeFromPriorityAction) + '">' + removeIcon + '</button>' : '')
        + '</div>';
    })
    .join('') + '</div>', { childrenOnly: true });

  morphdom(availableList, '<div>' + defaultProfiles
    .map((profile) => {
      const isActive = state.activeProfileId === profile.id;
      const classes = ['fallback-chip'];
      if (isActive) {
        classes.push('active', 'no-drag');
      }
      return '<div class="' + classes.join(' ') + '" data-fallback-chip="true" data-profile-id="' + escapeText(profile.id) + '">'
        + '<span class="fallback-chip-label">' + escapeText(profile.label) + '</span>'
        + '<span class="fallback-chip-provider">' + escapeText(profile.providerLabel) + '</span>'
        + (isActive ? '<span class="fallback-chip-badge">' + escapeText(state.i18n.fallbackChipActive) + '</span>' : '')
        + (!isActive ? '<button class="fallback-chip-btn" data-action="prioritizeFallback" data-profile-id="' + escapeText(profile.id) + '" title="' + escapeText(state.i18n.addToPriorityAction) + '">' + addIcon + '</button>' : '')
        + '</div>';
    })
    .join('') + '</div>', { childrenOnly: true });

  activeZone.style.display = '';
  availableZone.style.display = defaultProfiles.length > 0 ? '' : 'none';

  initSortable();
  syncFallbackControlState();
}

function initSortable(): void {
  if (activeSortable) {
    activeSortable.destroy();
    activeSortable = null;
  }
  if (availableSortable) {
    availableSortable.destroy();
    availableSortable = null;
  }

  const activeList = $('fallbackActiveList');
  const availableList = $('fallbackAvailableList');
  if (!activeList || !availableList) {
    return;
  }

  const groupOptions: Sortable.GroupOptions = {
    name: 'fallback',
    put: true,
    pull: true
  };

  activeSortable = new Sortable(activeList, {
    group: groupOptions,
    animation: 150,
    filter: '.no-drag',
    preventOnFilter: true,
    disabled: fallbackBusy,
    ghostClass: 'sortable-ghost',
    chosenClass: 'sortable-chosen',
    dragClass: 'sortable-drag',
    onEnd(evt) {
      if (evt.from === evt.to && evt.oldIndex === evt.newIndex) {
        return;
      }
      if (evt.from === activeList && evt.to === availableList) {
        const profileId = evt.item.getAttribute('data-profile-id');
        if (profileId) {
          postFallbackAction({
            command: 'clearFallbackPriority',
            profileId
          });
        }
        return;
      }
      if (evt.from === availableList && evt.to === activeList) {
        const activeChip = activeList.querySelector('.fallback-chip.active');
        if (activeChip && activeChip !== activeList.firstElementChild) {
          activeList.insertBefore(activeChip, activeList.firstChild);
        }
        const profileId = evt.item.getAttribute('data-profile-id');
        if (profileId) {
          postFallbackAction({
            command: 'prioritizeFallbackProfile',
            profileId
          });
        }
        return;
      }
      if (evt.from === activeList && evt.to === activeList) {
        const activeChip = activeList.querySelector('.fallback-chip.active');
        if (activeChip && activeChip !== activeList.firstElementChild) {
          activeList.insertBefore(activeChip, activeList.firstChild);
        }
        const newOrder: string[] = [];
        activeList
          .querySelectorAll('[data-fallback-chip]')
          .forEach((chip) => {
            const id = chip.getAttribute('data-profile-id');
            if (id && id !== state.activeProfileId) {
              newOrder.push(id);
            }
          });
        postFallbackAction({
          command: 'reorderFallbackProfiles',
          newOrder
        });
        return;
      }
    },
    onMove(evt) {
      if (evt.to !== activeList) {
        return undefined;
      }
      const activeChip = activeList.querySelector('.fallback-chip.active');
      if (!activeChip) {
        return undefined;
      }
      if (evt.related === activeChip && !evt.willInsertAfter) {
        return false;
      }
      return undefined;
    }
  });

  availableSortable = new Sortable(availableList, {
    group: groupOptions,
    animation: 150,
    sort: false,
    filter: '.no-drag',
    preventOnFilter: true,
    disabled: fallbackBusy,
    ghostClass: 'sortable-ghost',
    chosenClass: 'sortable-chosen',
    dragClass: 'sortable-drag'
  });
}

function renderProfiles(): void {
  if (state.profiles.length === 0) {
    $('emptyState').classList.add('active');
  } else {
    $('emptyState').classList.remove('active');
  }
  morphdom($('profilesContainer'), '<div>' + state.profiles
    .map((profile) => {
      const isActive = state.activeProfileId === profile.id;
      const ts = testStates.get(profile.id) || { status: 'idle' };
      const pillText = isActive
        ? state.i18n.currentProfile
        : profile.hasApiKey
          ? state.i18n.secretStoredStatus
          : state.i18n.secretMissingStatus;
      const pillIcon = isActive ? icons.check : '';
      const testRow = ts.status === 'success' || ts.status === 'error'
        ? '<div class="card-test-row"><div class="test-status ' + ts.status + '">'
          + (ts.status === 'success' ? icons.checkSmall : icons.xSmall) + ' '
          + escapeText(ts.status === 'success'
            ? state.i18n.testConnectionSuccess + (ts.latencyMs ? ' - ' + (ts.latencyMs / 1000).toFixed(1) + 's' : '')
            : state.i18n.testConnectionFailed)
          + '</div></div>'
        : '<div class="card-test-row"></div>';

      return '<article class="card' + (isActive ? ' active' : '') + '">'
        + '<div class="card-header">'
        + '<div class="card-title-group">'
        + '<h3 class="name">' + escapeText(profile.label) + '</h3>'
        + '<div class="provider-name">' + escapeText(profile.providerLabel) + '</div>'
        + '</div>'
        + '<div class="pill">' + pillIcon + escapeText(pillText) + '</div>'
        + '</div>'
        + '<div class="desc">' + escapeText(profile.providerDescription) + '</div>'
        + '<div class="meta-grid">'
        + '<div class="label">' + escapeText(state.i18n.model) + '</div>'
        + '<div class="value">' + escapeText(profile.model) + '</div>'
        + (profile.baseUrl
          ? '<div class="label">' + escapeText(state.i18n.apiEndpoint) + '</div><div class="value">' + escapeText(profile.baseUrl) + '</div>'
          : '')
        + '</div>'
        + '<div class="card-actions">'
        + (isActive ? ''
          : '<button class="btn primary" style="margin-right: auto" data-action="switch" data-profile-id="' + escapeText(profile.id) + '">'
            + icons.star + escapeText(state.i18n.useThisProfile) + '</button>')
        + '<button class="icon-btn' + (ts.status === 'testing' ? ' testing' : '') + '" title="' + escapeText(state.i18n.testAction) + '" data-action="test" data-profile-id="' + escapeText(profile.id) + '">'
        + (ts.status === 'testing' ? '<span class="test-spinner"></span>' : icons.bolt) + '</button>'
        + '<button class="icon-btn" title="' + escapeText(state.i18n.editAction) + '" data-action="edit" data-profile-id="' + escapeText(profile.id) + '">' + icons.edit + '</button>'
        + '<button class="icon-btn danger" title="' + escapeText(state.i18n.deleteAction) + '" data-action="delete" data-profile-id="' + escapeText(profile.id) + '">' + icons.trash + '</button>'
        + '</div>'
        + testRow
        + '</article>';
    })
    .join('') + '</div>', { childrenOnly: true });
  renderFallbackPanel();
}

function renderProviders(): void {
  const selected = getSelectedProvider();
  morphdom($('providerPicker'), '<div>' + state.providers
    .map((provider) =>
      '<button type="button" class="provider ' + (provider.type === selected.type ? 'active' : '') + '" data-provider-type="' + escapeText(provider.type) + '">'
      + '<div class="provider-title">' + escapeText(provider.label) + '</div>'
      + '<div class="provider-desc">' + escapeText(provider.description) + '</div>'
      + '</button>'
    )
    .join('') + '</div>', { childrenOnly: true });
}

function onProviderChange(resetFields: boolean): void {
  const provider = getSelectedProvider();
  $('modelLabel').textContent =
    getRequiredLabel(provider.modelInputKind === 'deployment'
      ? state.i18n.deploymentName
      : state.i18n.model, true);
  ($('modelHint') as HTMLElement).textContent =
    provider.modelInputKind === 'deployment'
      ? state.i18n.deploymentNameHint
      : state.i18n.modelNameHint;
  ($('model') as HTMLInputElement).placeholder =
    provider.modelPlaceholder || '';
  if (resetFields) {
    ($('model') as HTMLInputElement).value = provider.defaultModel || '';
  }
  if (provider.baseUrlMode === 'hidden') {
    ($('baseUrlGroup') as HTMLElement).style.display = 'none';
    $('baseUrlLabel').textContent = state.i18n.apiEndpoint;
    ($('baseUrl') as HTMLInputElement).required = false;
    ($('baseUrl') as HTMLInputElement).value = '';
  } else {
    const baseUrlRequired = provider.baseUrlMode === 'required';
    ($('baseUrlGroup') as HTMLElement).style.display = 'block';
    $('baseUrlLabel').textContent = getRequiredLabel(state.i18n.apiEndpoint, baseUrlRequired);
    ($('baseUrl') as HTMLInputElement).required = baseUrlRequired;
    ($('baseUrl') as HTMLInputElement).placeholder =
      provider.baseUrlPlaceholder || provider.defaultBaseUrl || '';
    if (resetFields) {
      ($('baseUrl') as HTMLInputElement).value =
        provider.baseUrlMode === 'optional'
          ? provider.defaultBaseUrl || ''
          : '';
    }
    ($('baseUrlHint') as HTMLElement).textContent =
      baseUrlRequired
        ? state.i18n.apiEndpointHintRequired
        : state.i18n.apiEndpointHintOptional;
  }
  updateApiKeyFieldState();
}

function updateApiKeyFieldState(): void {
  const editingProfile = getEditingProfile();
  const keepsExistingKey = Boolean(editingProfile && editingProfile.hasApiKey);
  const apiKeyRequired = !keepsExistingKey;
  const apiKeyInput = $('apiKey') as HTMLInputElement;
  const apiKeyStatus = $('apiKeyStatus');

  $('apiKeyLabel').textContent = getRequiredLabel(state.i18n.apiKey, apiKeyRequired);
  ($('apiKeyHint') as HTMLElement).textContent = keepsExistingKey
    ? state.i18n.apiKeyHintExisting
    : state.i18n.apiKeyHintNew;
  apiKeyInput.required = apiKeyRequired;

  if (keepsExistingKey) {
    apiKeyStatus.textContent = state.i18n.apiKeyStoredNotice;
    apiKeyStatus.classList.add('active');
    apiKeyStatus.classList.remove('warning');
    return;
  }

  if (editingProfile) {
    apiKeyStatus.textContent = state.i18n.apiKeyRequiredNotice;
    apiKeyStatus.classList.add('active', 'warning');
    return;
  }

  apiKeyStatus.textContent = '';
  apiKeyStatus.classList.remove('active', 'warning');
}

function selectProvider(
  providerType: string,
  resetFields: boolean
): void {
  ($('provider') as HTMLInputElement).value = providerType;
  renderProviders();
  onProviderChange(resetFields);
}

function showAddForm(): void {
  $('formTitle').textContent = state.i18n.addProfileTitle;
  $('formSubtitle').textContent = state.i18n.profileManagerReadyDescription;
  ($('profileId') as HTMLInputElement).value = '';
  ($('label') as HTMLInputElement).value = '';
  ($('model') as HTMLInputElement).value = '';
  ($('baseUrl') as HTMLInputElement).value = '';
  ($('apiKey') as HTMLInputElement).value = '';
  selectProvider(state.providers[0].type, true);
  setBanner('');
  setFormError('');
  openModal();
}

function showEditForm(profileId: string): void {
  const profile = getProfileById(profileId);
  if (!profile) {
    return;
  }
  $('formTitle').textContent = state.i18n.editProfileTitle;
  $('formSubtitle').textContent = state.i18n.profileManagerReadyTitle;
  ($('profileId') as HTMLInputElement).value = profile.id;
  ($('label') as HTMLInputElement).value = profile.label;
  ($('model') as HTMLInputElement).value = profile.model;
  ($('baseUrl') as HTMLInputElement).value = profile.baseUrl || '';
  ($('apiKey') as HTMLInputElement).value = '';
  ($('provider') as HTMLInputElement).value = profile.provider;
  renderProviders();
  onProviderChange(false);
  setBanner('');
  setFormError('');
  openModal();
}

function saveProfile(): void {
  const provider = getSelectedProvider();
  const editingProfile = getEditingProfile();
  const apiKey = ($('apiKey') as HTMLInputElement).value.trim();
  const data = {
    id: ($('profileId') as HTMLInputElement).value.trim() || undefined,
    label: ($('label') as HTMLInputElement).value.trim(),
    provider: ($('provider') as HTMLInputElement).value,
    model: ($('model') as HTMLInputElement).value.trim(),
    baseUrl: ($('baseUrl') as HTMLInputElement).value.trim(),
    apiKey: apiKey || undefined
  };
  if (!data.label) {
    setFormError(state.i18n.profileNameRequired);
    return;
  }
  if (!data.model) {
    setFormError(state.i18n.profileModelRequired);
    return;
  }
  if (provider.baseUrlMode === 'required' && !data.baseUrl) {
    setFormError(state.i18n.profileBaseUrlRequired);
    return;
  }
  if (!data.apiKey && !(editingProfile && editingProfile.hasApiKey)) {
    setFormError(state.i18n.apiKeyRequired);
    return;
  }
  setFormError('');
  vscode.postMessage({ command: 'saveProfile', data });
}

function applyInitialAction(): void {
  if (state.initialAction === 'add') {
    showAddForm();
    return;
  }
  if (state.initialAction === 'edit' && state.profiles.length === 1) {
    showEditForm(state.profiles[0].id);
    return;
  }
  if (state.initialAction === 'edit' && state.profiles.length > 1) {
    setBanner(state.i18n.editProfilePrompt);
    return;
  }
  if (state.initialAction === 'delete' && state.profiles.length > 1) {
    setBanner(state.i18n.deleteProfilePrompt);
  }
}

// Event listeners
$('profilesContainer').addEventListener('click', (event: MouseEvent) => {
  const target = (event.target as HTMLElement).closest('[data-action]');
  if (!target) {
    return;
  }
  const action = target.getAttribute('data-action');
  const profileId = target.getAttribute('data-profile-id');
  if (!profileId) {
    return;
  }
  if (action === 'switch') {
    vscode.postMessage({ command: 'switchProfile', profileId });
    return;
  }
  if (action === 'edit') {
    showEditForm(profileId);
    return;
  }
  if (action === 'delete') {
    showDeleteConfirm(profileId);
    return;
  }
  if (action === 'test') {
    const current = testStates.get(profileId);
    if (current?.status === 'testing') {
      return;
    }
    clearTestState(profileId);
    testStates.set(profileId, { status: 'testing' });
    renderProfiles();
    vscode.postMessage({ command: 'testProfile', profileId });
    return;
  }
});

$('fallbackActiveList').addEventListener('click', (event: MouseEvent) => {
  const target = (event.target as HTMLElement).closest('[data-action]');
  if (!target) {
    return;
  }
  const action = target.getAttribute('data-action');
  const profileId = target.getAttribute('data-profile-id');
  if (!profileId) {
    return;
  }
  if (action === 'clearFallbackPriority') {
    postFallbackAction({ command: 'clearFallbackPriority', profileId });
  }
});

$('fallbackAvailableList').addEventListener('click', (event: MouseEvent) => {
  const target = (event.target as HTMLElement).closest('[data-action]');
  if (!target) {
    return;
  }
  const action = target.getAttribute('data-action');
  const profileId = target.getAttribute('data-profile-id');
  if (!profileId) {
    return;
  }
  if (action === 'prioritizeFallback') {
    postFallbackAction({ command: 'prioritizeFallbackProfile', profileId });
  }
});

$('providerPicker').addEventListener('click', (event: MouseEvent) => {
  const target = (event.target as HTMLElement).closest('[data-provider-type]');
  if (target) {
    selectProvider(target.getAttribute('data-provider-type')!, true);
  }
});

$('addProfileButton').addEventListener('click', showAddForm);
$('emptyStateAddButton').addEventListener('click', showAddForm);
$('cancelButton').addEventListener('click', hideForm);
$('closeButton').addEventListener('click', hideForm);
$('saveButton').addEventListener('click', saveProfile);
$('cancelDeleteButton').addEventListener('click', hideDeleteConfirm);
$('confirmDeleteButton').addEventListener('click', confirmDeleteProfile);
$('deleteConfirmModal').addEventListener('click', (event: MouseEvent) => {
  if (event.target === $('deleteConfirmModal')) {
    hideDeleteConfirm();
  }
});
$('openSettingsButton').addEventListener('click', () => {
  vscode.postMessage({ command: 'openSettings' });
});
$('languageSelect').addEventListener('change', (event: Event) => {
  vscode.postMessage({
    command: 'updateLanguage',
    language: (event.target as HTMLSelectElement).value
  });
});

window.addEventListener('message', (event: MessageEvent) => {
  if (!event.data || !event.data.command) {
    return;
  }
  if (event.data.command === 'stateUpdate' && event.data.state) {
    const newState = event.data.state as WebviewState;
    Object.assign(state, newState);
    updateProviderMap();
    clearAllTestStates();
    renderProfiles();
    renderProviders();
    onProviderChange(false);
    ($('languageSelect') as HTMLSelectElement).value = state.currentLanguage;
    ($('provider') as HTMLInputElement).value = state.providers[0].type;
    $('statProfileCount').textContent = String(state.profiles.length);
    $('statActiveProfile').textContent = state.activeProfileLabel || state.i18n.noActiveProfileLabel;
  }
  if (event.data.command === 'fallbackActionSettled') {
    setFallbackBusy(false);
  }
  if (event.data.command === 'profileSaved') {
    hideForm();
  }
  if (event.data.command === 'testResult') {
    const { profileId, success, latencyMs } = event.data as {
      profileId: string;
      success: boolean;
      latencyMs?: number;
    };
    const existing = testStates.get(profileId);
    if (!existing || existing.status !== 'testing') {
      return;
    }
    clearTestState(profileId);
    const newStatus: TestCardState = {
      status: success ? 'success' : 'error',
      latencyMs
    };
    newStatus.dismissTimer = setTimeout(() => {
      clearTestState(profileId);
      renderProfiles();
    }, success ? 3000 : 5000);
    testStates.set(profileId, newStatus);
    renderProfiles();
  }
});

document.addEventListener('keydown', (event: KeyboardEvent) => {
  if (
    event.key === 'Escape' &&
    $('deleteConfirmModal').classList.contains('active')
  ) {
    hideDeleteConfirm();
    return;
  }

  if (
    event.key === 'Escape' &&
    $('formModal').classList.contains('active')
  ) {
    hideForm();
  }
});

// Bootstrap
($('provider') as HTMLInputElement).value = state.providers[0].type;
renderProviders();
renderProfiles();
onProviderChange(true);
applyInitialAction();

export function buildClientPreludeScript(): string {
  return `
    const vscode = acquireVsCodeApi();
    const providerMap = Object.fromEntries(state.providers.map((provider) => [provider.type, provider]));
    const $ = (id) => document.getElementById(id);
    const escapeText = (value) => { const div = document.createElement('div'); div.textContent = value || ''; return div.innerHTML; };
    const getProfileById = (profileId) => state.profiles.find((profile) => profile.id === profileId);
    const getEditingProfile = () => $('profileId').value ? getProfileById($('profileId').value) : undefined;
    const getSelectedProvider = () => providerMap[$('provider').value] || state.providers[0];
    const setBanner = (message) => { $('actionBanner').textContent = message || ''; $('actionBanner').classList.toggle('active', Boolean(message)); };
    const setFormError = (message) => { $('formError').textContent = message || ''; $('formError').classList.toggle('active', Boolean(message)); };
    const openModal = () => { $('formModal').classList.add('active'); $('formModal').setAttribute('aria-hidden', 'false'); $('label').focus(); };
    const hideForm = () => { $('formModal').classList.remove('active'); $('formModal').setAttribute('aria-hidden', 'true'); setFormError(''); };
    let fallbackBusy = false;
    const syncFallbackControlState = () => {
      document.querySelectorAll('[data-action="moveFallbackEarlier"], [data-action="moveFallbackLater"], [data-action="clearFallbackPriority"]').forEach((button) => {
        button.disabled = fallbackBusy || button.hasAttribute('disabled');
      });
    };
    const setFallbackBusy = (busy) => {
      fallbackBusy = busy;
      syncFallbackControlState();
    };
    const postFallbackAction = (message) => {
      if (fallbackBusy) { return; }
      setFallbackBusy(true);
      vscode.postMessage(message);
    };

    const icons = {
      check: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>',
      edit: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>',
      trash: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>',
      star: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>'
    };
  `;
}

export function buildClientRenderScript(): string {
  return `
    function renderFallbackPanel() {
      const panelTitle = $('fallbackPanelTitle');
      const panelActions = $('fallbackPanelActions');
      const fallbackList = $('fallbackList');
      if (!panelTitle || !fallbackList) { return; }

      if (state.profiles.length < 2) {
        panelTitle.textContent = '';
        fallbackList.innerHTML = '<span class="fallback-empty">' + escapeText(state.i18n.defaultFallbackOrder) + '</span>';
        panelActions.innerHTML = '';
        return;
      }

      panelTitle.textContent = state.i18n.fallbackPanelTitle;

      const explicitFallbackCount = state.profiles.filter((p) => p.hasExplicitFallbackPriority).length;
      const explicitProfiles = state.profiles.filter((p) => p.hasExplicitFallbackPriority).sort((a, b) => a.fallbackPriority - b.fallbackPriority);
      const defaultProfiles = state.profiles.filter((p) => !p.hasExplicitFallbackPriority);

      const arrowUpIcon = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="18 15 12 9 6 15"></polyline></svg>';
      const arrowDownIcon = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>';

      fallbackList.innerHTML = explicitProfiles.map((profile, index) => {
        const isActive = state.activeProfileId === profile.id;
        const isSkipped = profile.isSkippedWhileActive;
        const isFirst = profile.fallbackPriority === 1;
        const isLast = profile.fallbackPriority === explicitFallbackCount;
        const prevProfile = index > 0 ? explicitProfiles[index - 1] : null;
        const nextProfile = index < explicitProfiles.length - 1 ? explicitProfiles[index + 1] : null;
        const blockedBySkippedPrev = prevProfile && prevProfile.isSkippedWhileActive;
        const blockedBySkippedNext = nextProfile && nextProfile.isSkippedWhileActive;
        const classes = ['fallback-chip', 'explicit'];
        if (isActive) { classes.push('active'); }
        if (isSkipped) { classes.push('skipped'); }
        const canMoveUp = !isFirst && !isSkipped && !blockedBySkippedPrev;
        const canMoveDown = !isLast && !isSkipped && !blockedBySkippedNext;
        const moveButtons = isSkipped ? '' : (
          '<div class="fallback-chip-move">' +
            '<button class="fallback-chip-btn" data-action="moveFallbackEarlier" data-profile-id="' + escapeText(profile.id) + '" ' + (canMoveUp ? '' : 'disabled') + ' title="' + escapeText(state.i18n.moveUpAction) + '">' + arrowUpIcon + '</button>' +
            '<button class="fallback-chip-btn" data-action="moveFallbackLater" data-profile-id="' + escapeText(profile.id) + '" ' + (canMoveDown ? '' : 'disabled') + ' title="' + escapeText(state.i18n.moveDownAction) + '">' + arrowDownIcon + '</button>' +
          '</div>'
        );
        return (
          '<div class="' + classes.join(' ') + '" data-fallback-chip="true" data-profile-id="' + escapeText(profile.id) + '">' +
            '<span class="fallback-chip-rank">#' + profile.fallbackPriority + '</span>' +
            '<span class="fallback-chip-label">' + escapeText(profile.label) + '</span>' +
            '<span class="fallback-chip-provider">' + escapeText(profile.providerLabel) + '</span>' +
            (isActive ? '<span class="fallback-chip-badge">' + escapeText(state.i18n.fallbackChipActive) + '</span>' : '') +
            (isSkipped && !isActive ? '<span class="fallback-chip-badge">' + escapeText(state.i18n.skippedWhileActive) + '</span>' : '') +
            moveButtons +
            '<button class="fallback-chip-btn" data-action="clearFallbackPriority" data-profile-id="' + escapeText(profile.id) + '" title="' + escapeText(state.i18n.useDefaultFallbackOrderAction) + '">' +
              '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>' +
            '</button>' +
          '</div>'
        );
      }).join('');

      if (defaultProfiles.length > 0) {
        fallbackList.innerHTML += defaultProfiles.map((profile) => {
          const isActive = state.activeProfileId === profile.id;
          const classes = ['fallback-chip', 'default'];
          if (isActive) { classes.push('active'); }
          if (profile.isSkippedWhileActive) { classes.push('skipped'); }
          return (
            '<div class="' + classes.join(' ') + '" data-fallback-chip="true" data-profile-id="' + escapeText(profile.id) + '">' +
              '<span class="fallback-chip-rank">—</span>' +
              '<span class="fallback-chip-label">' + escapeText(profile.label) + '</span>' +
              '<span class="fallback-chip-provider">' + escapeText(profile.providerLabel) + '</span>' +
              (isActive ? '<span class="fallback-chip-badge">' + escapeText(state.i18n.fallbackChipActive) + '</span>' : '') +
              '<button class="fallback-chip-btn" data-action="prioritizeFallback" data-profile-id="' + escapeText(profile.id) + '" title="' + escapeText(state.i18n.addToPriorityAction) + '">' +
                '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>' +
              '</button>' +
            '</div>'
          );
        }).join('');
      }

      panelActions.innerHTML = '';
      syncFallbackControlState();
    }

    function renderProfiles() {
      if (state.profiles.length === 0) {
        $('emptyState').classList.add('active');
        $('profilesContainer').innerHTML = '';
        renderFallbackPanel();
        return;
      }
      $('emptyState').classList.remove('active');
      $('profilesContainer').innerHTML = state.profiles.map((profile) => {
        const isActive = state.activeProfileId === profile.id;
        const pillText = isActive ? state.i18n.currentProfile : (profile.hasApiKey ? state.i18n.secretStoredStatus : state.i18n.secretMissingStatus);
        const pillIcon = isActive ? icons.check : '';

        return (
          '<article class="card ' + (isActive ? 'active' : '') + '">' +
            '<div class="card-header">' +
              '<div class="card-title-group">' +
                '<h3 class="name">' + escapeText(profile.label) + '</h3>' +
                '<div class="provider-name">' + escapeText(profile.providerLabel) + '</div>' +
              '</div>' +
              '<div class="pill">' + pillIcon + escapeText(pillText) + '</div>' +
            '</div>' +
            '<div class="desc">' + escapeText(profile.providerDescription) + '</div>' +
            '<div class="meta-grid">' +
              '<div class="label">' + escapeText(state.i18n.model) + '</div>' +
              '<div class="value">' + escapeText(profile.model) + '</div>' +
              (profile.baseUrl ? '<div class="label">' + escapeText(state.i18n.apiEndpoint) + '</div><div class="value">' + escapeText(profile.baseUrl) + '</div>' : '') +
            '</div>' +
            '<div class="card-actions">' +
              (isActive ? '' : '<button class="btn primary" style="margin-right: auto" data-action="switch" data-profile-id="' + escapeText(profile.id) + '">' + icons.star + escapeText(state.i18n.useThisProfile) + '</button>') +
              '<button class="icon-btn" title="' + escapeText(state.i18n.editAction) + '" data-action="edit" data-profile-id="' + escapeText(profile.id) + '">' + icons.edit + '</button>' +
              '<button class="icon-btn danger" title="' + escapeText(state.i18n.deleteAction) + '" data-action="delete" data-profile-id="' + escapeText(profile.id) + '">' + icons.trash + '</button>' +
            '</div>' +
          '</article>'
        );
      }).join('');
      renderFallbackPanel();
    }

    function renderProviders() {
      const selected = getSelectedProvider();
      $('providerPicker').innerHTML = state.providers.map((provider) => (
        '<button type="button" class="provider ' + (provider.type === selected.type ? 'active' : '') + '" data-provider-type="' + escapeText(provider.type) + '">' +
          '<div class="provider-title">' + escapeText(provider.label) + '</div>' +
          '<div class="provider-desc">' + escapeText(provider.description) + '</div>' +
        '</button>'
      )).join('');
    }
  `;
}

export function buildClientFormScript(): string {
  return `
    function onProviderChange(resetFields) {
      const provider = getSelectedProvider();
      const editingProfile = getEditingProfile();
      $('modelLabel').textContent = (provider.modelInputKind === 'deployment' ? state.i18n.deploymentName : state.i18n.model) + ' *';
      $('modelHint').textContent = provider.modelInputKind === 'deployment' ? state.i18n.deploymentNameHint : state.i18n.modelNameHint;
      $('model').placeholder = provider.modelPlaceholder || '';
      if (resetFields) {
        $('model').value = provider.defaultModel || '';
      }
      if (provider.baseUrlMode === 'hidden') {
        $('baseUrlGroup').style.display = 'none';
        $('baseUrl').value = '';
      } else {
        $('baseUrlGroup').style.display = 'block';
        $('baseUrl').placeholder = provider.baseUrlPlaceholder || provider.defaultBaseUrl || '';
        if (resetFields) {
          $('baseUrl').value = provider.baseUrlMode === 'optional' ? (provider.defaultBaseUrl || '') : '';
        }
        $('baseUrlHint').textContent = provider.baseUrlMode === 'required' ? state.i18n.apiEndpointHintRequired : state.i18n.apiEndpointHintOptional;
      }
      $('apiKeyHint').textContent = editingProfile && editingProfile.hasApiKey ? state.i18n.apiKeyHintExisting : state.i18n.apiKeyHintNew;
    }

    function selectProvider(providerType, resetFields) {
      $('provider').value = providerType;
      renderProviders();
      onProviderChange(resetFields);
    }

    function showAddForm() {
      $('formTitle').textContent = state.i18n.addProfileTitle;
      $('formSubtitle').textContent = state.i18n.profileManagerReadyDescription;
      $('profileId').value = ''; $('label').value = ''; $('model').value = ''; $('baseUrl').value = ''; $('apiKey').value = '';
      selectProvider(state.providers[0].type, true);
      setBanner(''); setFormError(''); openModal();
    }

    function showEditForm(profileId) {
      const profile = getProfileById(profileId);
      if (!profile) { return; }
      $('formTitle').textContent = state.i18n.editProfileTitle;
      $('formSubtitle').textContent = state.i18n.profileManagerReadyTitle;
      $('profileId').value = profile.id; $('label').value = profile.label; $('model').value = profile.model; $('baseUrl').value = profile.baseUrl || ''; $('apiKey').value = '';
      $('provider').value = profile.provider; renderProviders(); onProviderChange(false); setBanner(''); setFormError(''); openModal();
    }

    function saveProfile() {
      const provider = getSelectedProvider();
      const editingProfile = getEditingProfile();
      const data = { id: $('profileId').value.trim() || undefined, label: $('label').value.trim(), provider: $('provider').value, model: $('model').value.trim(), baseUrl: $('baseUrl').value.trim(), apiKey: $('apiKey').value.trim() };
      if (!data.label) { setFormError(state.i18n.profileNameRequired); return; }
      if (!data.model) { setFormError(state.i18n.profileModelRequired); return; }
      if (provider.baseUrlMode === 'required' && !data.baseUrl) { setFormError(state.i18n.profileBaseUrlRequired); return; }
      if (!data.apiKey && !(editingProfile && editingProfile.hasApiKey)) { setFormError(state.i18n.apiKeyRequired); return; }
      setFormError('');
      vscode.postMessage({ command: 'saveProfile', data });
    }

    function applyInitialAction() {
      if (state.initialAction === 'add') { showAddForm(); return; }
      if (state.initialAction === 'edit' && state.profiles.length === 1) { showEditForm(state.profiles[0].id); return; }
      if (state.initialAction === 'edit' && state.profiles.length > 1) { setBanner(state.i18n.editProfilePrompt); return; }
      if (state.initialAction === 'delete' && state.profiles.length > 1) { setBanner(state.i18n.deleteProfilePrompt); }
    }
  `;
}

export function buildClientEventScript(): string {
  return `
    $('profilesContainer').addEventListener('click', (event) => {
      const target = event.target.closest('[data-action]');
      if (!target) { return; }
      const action = target.getAttribute('data-action');
      const profileId = target.getAttribute('data-profile-id');
      if (!profileId) { return; }
      if (action === 'switch') { vscode.postMessage({ command: 'switchProfile', profileId }); return; }
      if (action === 'edit') { showEditForm(profileId); return; }
      if (action === 'delete') { vscode.postMessage({ command: 'deleteProfile', profileId }); return; }
    });
    $('fallbackList').addEventListener('click', (event) => {
      const target = event.target.closest('[data-action]');
      if (!target) { return; }
      const action = target.getAttribute('data-action');
      const profileId = target.getAttribute('data-profile-id');
      if (!profileId) { return; }
      if (action === 'prioritizeFallback') { postFallbackAction({ command: 'prioritizeFallbackProfile', profileId }); return; }
      if (action === 'moveFallbackEarlier') { postFallbackAction({ command: 'moveFallbackProfile', profileId, direction: 'up' }); return; }
      if (action === 'moveFallbackLater') { postFallbackAction({ command: 'moveFallbackProfile', profileId, direction: 'down' }); return; }
      if (action === 'clearFallbackPriority') { postFallbackAction({ command: 'clearFallbackPriority', profileId }); }
    });
    $('providerPicker').addEventListener('click', (event) => {
      const target = event.target.closest('[data-provider-type]');
      if (target) { selectProvider(target.getAttribute('data-provider-type'), true); }
    });
    $('addProfileButton').addEventListener('click', showAddForm);
    $('emptyStateAddButton').addEventListener('click', showAddForm);
    $('cancelButton').addEventListener('click', hideForm);
    $('closeButton').addEventListener('click', hideForm);
    $('saveButton').addEventListener('click', saveProfile);
    $('openSettingsButton').addEventListener('click', () => {
      vscode.postMessage({ command: 'openSettings' });
    });
    $('languageSelect').addEventListener('change', (event) => {
      vscode.postMessage({ command: 'updateLanguage', language: event.target.value });
    });
    window.addEventListener('message', (event) => {
      if (event.data && event.data.command === 'fallbackActionSettled') {
        setFallbackBusy(false);
      }
    });
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && $('formModal').classList.contains('active')) { hideForm(); }
    });
  `;
}

export function buildClientBootstrapScript(): string {
  return `
    $('provider').value = state.providers[0].type;
    renderProviders();
    renderProfiles();
    onProviderChange(true);
    applyInitialAction();
  `;
}
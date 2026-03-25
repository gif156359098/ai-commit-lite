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
  `;
}

export function buildClientRenderScript(): string {
  return `
    function renderProfiles() {
      if (state.profiles.length === 0) {
        $('emptyState').classList.add('active');
        $('profilesContainer').innerHTML = '';
        return;
      }
      $('emptyState').classList.remove('active');
      $('profilesContainer').innerHTML = state.profiles.map((profile) => (
        '<article class="card ' + (state.activeProfileId === profile.id ? 'active' : '') + '">' +
          '<div class="top"><div><h3 class="name">' + escapeText(profile.label) + '</h3><div class="provider-name">' + escapeText(profile.providerLabel) + '</div></div><div class="pill">' + escapeText(state.activeProfileId === profile.id ? state.i18n.currentProfile : (profile.hasApiKey ? state.i18n.secretStoredStatus : state.i18n.secretMissingStatus)) + '</div></div>' +
          '<div class="desc">' + escapeText(profile.providerDescription) + '</div>' +
          '<div class="meta"><div class="row"><div class="label">' + escapeText(state.i18n.model) + '</div><div class="value">' + escapeText(profile.model) + '</div></div>' +
          (profile.baseUrl ? '<div class="row"><div class="label">' + escapeText(state.i18n.apiEndpoint) + '</div><div class="value">' + escapeText(profile.baseUrl) + '</div></div>' : '') +
          '</div>' +
          '<div class="notes"><div class="note"><div class="note-label">' + escapeText(state.i18n.providerAudienceLabel) + '</div><div class="note-value">' + escapeText(profile.providerAudienceHint) + '</div></div><div class="note"><div class="note-label">' + escapeText(state.i18n.providerEndpointRuleLabel) + '</div><div class="note-value">' + escapeText(profile.endpointHint) + '</div></div></div>' +
          '<div class="actions">' +
            (state.activeProfileId !== profile.id ? '<button class="btn primary small" data-action="switch" data-profile-id="' + escapeText(profile.id) + '">' + escapeText(state.i18n.useThisProfile) + '</button>' : '') +
            '<button class="btn small" data-action="edit" data-profile-id="' + escapeText(profile.id) + '">' + escapeText(state.i18n.editAction) + '</button>' +
            '<button class="btn danger small" data-action="delete" data-profile-id="' + escapeText(profile.id) + '">' + escapeText(state.i18n.deleteAction) + '</button>' +
          '</div>' +
        '</article>'
      )).join('');
    }

    function renderProviders() {
      const selected = getSelectedProvider();
      $('providerPicker').innerHTML = state.providers.map((provider) => (
        '<button type="button" class="provider ' + (provider.type === selected.type ? 'active' : '') + '" data-provider-type="' + escapeText(provider.type) + '">' +
          '<div class="provider-title">' + escapeText(provider.label) + '</div>' +
          '<div class="provider-desc">' + escapeText(provider.description) + '</div>' +
          '<div class="provider-aud">' + escapeText(provider.audienceHint) + '</div>' +
          '<div class="provider-end">' + escapeText(provider.endpointHint) + '</div>' +
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
      if (action === 'switch') { vscode.postMessage({ command: 'switchProfile', profileId }); }
      if (action === 'edit') { showEditForm(profileId); }
      if (action === 'delete') { vscode.postMessage({ command: 'deleteProfile', profileId }); }
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

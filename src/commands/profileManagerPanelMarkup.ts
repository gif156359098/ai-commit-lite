import { LanguageOption, WebviewI18n } from './profileManagerPanelTypes';

export type EscapeHtml = (value: string) => string;

export function buildProfileManagerPanelBodyMarkup(
  i18n: WebviewI18n,
  profileCount: number,
  activeProfileLabel: string,
  currentLanguage: string,
  languageOptions: LanguageOption[],
  autoFallbackEnabled: boolean,
  escapeHtml: EscapeHtml,
): string {
  const plusIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>`;
  const settingsIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>`;

  const languageOptionsHtml = languageOptions.map((opt) =>
    `<option value="${escapeHtml(opt.value)}" ${opt.value === currentLanguage ? 'selected' : ''}>${escapeHtml(opt.label)}</option>`
  ).join('');

  return `
  <div class="shell">
    <section class="hero">
      <div class="hero-content">
        <p class="eyebrow">AI Commit Lite</p>
        <h1 class="title">${escapeHtml(i18n.title)}</h1>
        <p class="subtitle">${escapeHtml(i18n.subtitle)}</p>
      </div>
      <div class="stats">
        <div class="stat">
          <div class="stat-label">${escapeHtml(i18n.profilesConfiguredLabel)}</div>
          <div class="stat-value">${profileCount}</div>
        </div>
        <div class="stat">
          <div class="stat-label">${escapeHtml(i18n.activeProfileLabel)}</div>
          <div class="stat-value">${escapeHtml(activeProfileLabel)}</div>
        </div>
      </div>
    </section>

    <div class="toolbar">
      <div class="toolbar-count">${escapeHtml(i18n.profileCount)}</div>
      <div class="toolbar-actions">
        <div class="language-select-wrapper">
          <label for="languageSelect" class="language-label">${escapeHtml(i18n.languageSetting)}</label>
          <select id="languageSelect" class="language-select">
            ${languageOptionsHtml}
          </select>
        </div>
        <button class="btn" id="openSettingsButton" title="${escapeHtml(i18n.openSettingsAction)}">
          ${settingsIcon}
        </button>
        <button class="btn primary" id="addProfileButton">
          ${plusIcon}
          ${escapeHtml(i18n.addProfileAction)}
        </button>
      </div>
    </div>

    ${autoFallbackEnabled ? '' : `
    <div class="status-note warning">${escapeHtml(i18n.autoFallbackDisabledNotice)}</div>
    `}

    <div class="banner" id="actionBanner"></div>

    <section class="empty" id="emptyState">
      <h2>${escapeHtml(i18n.profileManagerEmptyTitle)}</h2>
      <p>${escapeHtml(i18n.profileManagerEmptyDescription)}</p>
      <button class="btn primary" id="emptyStateAddButton">
        ${plusIcon}
        ${escapeHtml(i18n.addProfileAction)}
      </button>
    </section>

    <div class="cards" id="profilesContainer"></div>
  </div>

  <div class="overlay" id="formModal" aria-hidden="true">
    <div class="modal" role="dialog" aria-modal="true" aria-labelledby="formTitle">
      <div class="modal-header">
        <div>
          <h2 id="formTitle">${escapeHtml(i18n.addProfileTitle)}</h2>
          <p id="formSubtitle">${escapeHtml(i18n.profileManagerReadyDescription)}</p>
        </div>
        <button class="close-btn" id="closeButton" type="button" aria-label="${escapeHtml(i18n.closeAction)}">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>
      </div>

      <div class="modal-body">
        <section class="pane-providers">
          <div class="pane-header">
            <div class="section-label">${escapeHtml(i18n.provider)}</div>
          </div>
          <div class="providers" id="providerPicker"></div>
        </section>

        <section class="pane-form">
          <div class="error" id="formError"></div>
          <input type="hidden" id="profileId" value="">
          <input type="hidden" id="provider" value="">

          <div class="field">
            <label for="label">${escapeHtml(i18n.profileDisplayName)} *</label>
            <input type="text" id="label" autocomplete="off">
            <div class="hint">${escapeHtml(i18n.profileDisplayNameHint)}</div>
          </div>

          <div class="field">
            <label for="model" id="modelLabel">${escapeHtml(i18n.model)} *</label>
            <input type="text" id="model" autocomplete="off">
            <div class="hint" id="modelHint">${escapeHtml(i18n.modelNameHint)}</div>
          </div>

          <div class="field" id="baseUrlGroup">
            <label for="baseUrl">${escapeHtml(i18n.apiEndpoint)}</label>
            <input type="text" id="baseUrl" autocomplete="off">
            <div class="hint" id="baseUrlHint">${escapeHtml(i18n.apiEndpointHintRequired)}</div>
          </div>

          <div class="field">
            <label for="apiKey">${escapeHtml(i18n.apiKey)} *</label>
            <input type="password" id="apiKey" autocomplete="off">
            <div class="hint" id="apiKeyHint">${escapeHtml(i18n.apiKeyHintNew)}</div>
          </div>

          <div class="form-actions">
            <button class="btn" id="cancelButton" type="button">${escapeHtml(i18n.cancelAction)}</button>
            <button class="btn primary" id="saveButton" type="button">${escapeHtml(i18n.saveAction)}</button>
          </div>
        </section>
      </div>
    </div>
  </div>`;
}
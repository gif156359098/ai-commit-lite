import { randomBytes } from 'crypto';
import { buildProfileManagerPanelBodyMarkup } from './profileManagerPanelMarkup';
import { buildProfileManagerPanelStyles } from './profileManagerPanelStyles';
import { BuildWebviewHtmlData } from './profileManagerPanelTypes';

export function buildWebviewHtml(data: BuildWebviewHtmlData, scriptUri: string): string {
  const {
    cspSource,
    locale,
    activeProfileLabel,
    activeProfileId,
    initialAction,
    i18n,
    providers,
    profiles,
    currentLanguage,
    languageOptions,
    autoFallbackEnabled
  } = data;
  const nonce = getNonce();
  const state = serializeForWebviewScript({
    activeProfileId,
    activeProfileLabel,
    initialAction,
    i18n,
    providers,
    profiles,
    currentLanguage,
    languageOptions,
    autoFallbackEnabled
  });

  return `<!DOCTYPE html>
<html lang="${locale}">
<head>
<meta charset="UTF-8">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}';">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHtml(i18n.title)}</title>
<style>${buildProfileManagerPanelStyles()}</style>
</head>
<body>
${buildProfileManagerPanelBodyMarkup(i18n, profiles.length, activeProfileLabel, currentLanguage, languageOptions, autoFallbackEnabled, escapeHtml)}
<script nonce="${nonce}">
window.state = ${state};
</script>
<script nonce="${nonce}" src="${scriptUri}"></script>
</body>
</html>`;
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function serializeForWebviewScript(value: unknown): string {
  return JSON.stringify(value)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');
}

function getNonce(): string {
  // Generate a cryptographically secure nonce using base64 encoding
  // The result contains only alphanumeric characters (A-Z, a-z, 0-9, +, /) with = padding
  // CSP allows alphanumeric + few special chars; we strip non-alphanumeric chars
  return randomBytes(16)
    .toString('base64')
    .replace(/[^A-Za-z0-9]/g, '');
}

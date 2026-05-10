export function buildProfileManagerPanelStyles(): string {
  return `
    :root {
      --bg: var(--vscode-editor-background);
      --fg: var(--vscode-foreground);
      --muted: var(--vscode-descriptionForeground);
      --border: var(--vscode-panel-border);
      --accent: var(--vscode-focusBorder);
      --accent-bg: var(--vscode-button-background);
      --accent-fg: var(--vscode-button-foreground);
      --accent-hover: var(--vscode-button-hoverBackground);
      --card-bg: color-mix(in srgb, var(--bg) 95%, var(--fg));
      --card-hover: color-mix(in srgb, var(--bg) 90%, var(--fg));
      --overlay-bg: color-mix(in srgb, var(--bg) 60%, transparent);
      --danger: var(--vscode-errorForeground);
      --danger-bg: color-mix(in srgb, var(--danger) 10%, transparent);
      --warning: var(--vscode-editorWarning-foreground, #d7ba7d);
      --warning-bg: color-mix(in srgb, var(--warning) 14%, transparent);
      --radius-sm: 6px;
      --radius-md: 12px;
      --radius-lg: 16px;
      --radius-xl: 24px;
      --shadow-sm: 0 4px 12px rgba(0, 0, 0, 0.08);
      --shadow-lg: 0 24px 48px rgba(0, 0, 0, 0.16);
      --transition: 0.2s cubic-bezier(0.2, 0.8, 0.2, 1);
    }

    * { box-sizing: border-box; margin: 0; padding: 0; }
    html, body { min-height: 100vh; background: var(--bg); color: var(--fg); font-family: var(--vscode-font-family); }
    body { padding: 32px; line-height: 1.5; }
    button, input, select { font: inherit; appearance: none; border: none; background: none; }
    button { cursor: pointer; transition: var(--transition); }
    button:disabled { cursor: not-allowed; opacity: 0.55; }

    ::-webkit-scrollbar { width: 8px; height: 8px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: color-mix(in srgb, var(--fg) 20%, transparent); border-radius: 4px; }
    ::-webkit-scrollbar-thumb:hover { background: color-mix(in srgb, var(--fg) 30%, transparent); }

    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes slideUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes modalScale { from { opacity: 0; transform: scale(0.96) translateY(10px); } to { opacity: 1; transform: scale(1) translateY(0); } }

    .shell { max-width: 1200px; margin: 0 auto; display: flex; flex-direction: column; gap: 24px; animation: fadeIn 0.4s ease-out; }
    .hero {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      gap: 24px;
      padding-bottom: 24px;
      border-bottom: 1px solid color-mix(in srgb, var(--border) 50%, transparent);
    }
    .hero-content { display: flex; flex-direction: column; gap: 8px; }
    .eyebrow { font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.1em; color: var(--accent); font-weight: 600; }
    .title { font-size: clamp(2rem, 4vw, 2.5rem); font-weight: 700; line-height: 1.1; margin: 0; }
    .subtitle { color: var(--muted); font-size: 1.05rem; max-width: 600px; }
    .stats { display: flex; gap: 16px; }
    .stat {
      background: var(--card-bg);
      padding: 16px 20px;
      border-radius: var(--radius-lg);
      border: 1px solid color-mix(in srgb, var(--border) 50%, transparent);
      min-width: 140px;
    }
    .stat-label { font-size: 0.8rem; color: var(--muted); margin-bottom: 4px; }
    .stat-value { font-size: 1.25rem; font-weight: 600; }

    .toolbar { display: flex; justify-content: space-between; align-items: center; gap: 16px; }
    .toolbar-count { font-size: 0.9rem; color: var(--muted); font-weight: 500; }
    .toolbar-actions { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
    .language-select-wrapper { display: flex; align-items: center; gap: 8px; }
    .language-label { font-size: 0.85rem; color: var(--muted); }
    .language-select {
      padding: 6px 10px;
      font-size: 0.85rem;
      background: var(--vscode-input-background);
      color: var(--vscode-input-foreground);
      border: 1px solid var(--vscode-input-border);
      border-radius: var(--radius-sm);
      cursor: pointer;
      min-width: 120px;
    }
    .language-select:focus { outline: none; border-color: var(--accent); }

    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 8px 16px;
      border-radius: var(--radius-sm);
      font-size: 0.9rem;
      font-weight: 500;
      background: color-mix(in srgb, var(--fg) 8%, transparent);
      color: var(--fg);
      border: 1px solid color-mix(in srgb, var(--border) 50%, transparent);
    }
    .btn:hover:not(:disabled) { background: color-mix(in srgb, var(--fg) 15%, transparent); }
    .btn.primary { background: var(--accent-bg); color: var(--accent-fg); border-color: transparent; }
    .btn.primary:hover:not(:disabled) { background: var(--accent-hover); }
    .btn.danger {
      background: var(--danger-bg);
      color: var(--danger);
      border-color: color-mix(in srgb, var(--danger) 35%, transparent);
    }
    .btn.danger:hover:not(:disabled) {
      background: color-mix(in srgb, var(--danger) 18%, transparent);
      border-color: color-mix(in srgb, var(--danger) 55%, transparent);
    }
    .btn svg { width: 16px; height: 16px; flex-shrink: 0; }

    .status-note {
      padding: 12px 14px;
      border-radius: var(--radius-md);
      border: 1px solid color-mix(in srgb, var(--border) 50%, transparent);
      background: color-mix(in srgb, var(--fg) 5%, transparent);
      color: var(--muted);
      font-size: 0.9rem;
    }
    .status-note.warning {
      background: var(--warning-bg);
      border-color: color-mix(in srgb, var(--warning) 30%, transparent);
      color: var(--fg);
    }

    .banner {
      display: none;
      padding: 12px 14px;
      border-radius: var(--radius-md);
      border: 1px solid color-mix(in srgb, var(--accent) 25%, transparent);
      background: color-mix(in srgb, var(--accent) 10%, transparent);
      color: var(--fg);
    }
    .banner.active { display: block; }

    .cards { display: grid; grid-template-columns: repeat(auto-fill, minmax(360px, 1fr)); gap: 20px; }
    .card {
      background: var(--card-bg);
      border-radius: var(--radius-lg);
      padding: 24px;
      border: 1px solid color-mix(in srgb, var(--border) 50%, transparent);
      display: flex;
      flex-direction: column;
      gap: 16px;
      transition: var(--transition);
      animation: slideUp 0.4s ease-out backwards;
    }
    .cards .card:nth-child(1) { animation-delay: 0.05s; }
    .cards .card:nth-child(2) { animation-delay: 0.1s; }
    .cards .card:nth-child(3) { animation-delay: 0.15s; }
    .card:hover { transform: translateY(-2px); box-shadow: var(--shadow-sm); border-color: var(--border); }
    .card.active { border-color: var(--accent); box-shadow: 0 0 0 1px var(--accent); }
    .card-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; }
    .card-title-group { display: flex; flex-direction: column; gap: 4px; flex: 1; min-width: 0; }
    .name { font-size: 1.15rem; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .provider-name { font-size: 0.85rem; color: var(--muted); }
    .pill {
      padding: 4px 10px;
      border-radius: 99px;
      font-size: 0.75rem;
      font-weight: 500;
      background: color-mix(in srgb, var(--fg) 8%, transparent);
      color: var(--muted);
      display: inline-flex;
      align-items: center;
      gap: 4px;
      white-space: nowrap;
      flex-shrink: 0;
    }
    .pill svg { width: 14px; height: 14px; flex-shrink: 0; }
    .card.active .pill { background: color-mix(in srgb, var(--accent) 15%, transparent); color: var(--accent); }

    .desc { font-size: 0.9rem; color: var(--muted); line-height: 1.6; }
    .meta-grid {
      display: grid;
      grid-template-columns: max-content 1fr;
      gap: 8px 16px;
      background: color-mix(in srgb, var(--bg) 50%, transparent);
      padding: 12px;
      border-radius: var(--radius-md);
    }
    .meta-grid .label { font-size: 0.8rem; color: var(--muted); }
    .meta-grid .value { font-size: 0.85rem; font-weight: 500; word-break: break-all; }

.fallback-panel {
display: flex;
flex-direction: column;
gap: 12px;
padding: 16px;
border-radius: var(--radius-lg);
border: 1px solid color-mix(in srgb, var(--border) 50%, transparent);
background: color-mix(in srgb, var(--bg) 40%, transparent);
}
.fallback-panel-header { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.fallback-panel-title {
font-size: 0.85rem;
font-weight: 600;
color: var(--muted);
text-transform: uppercase;
letter-spacing: 0.04em;
}
.fallback-zone {
display: flex;
flex-direction: column;
gap: 6px;
}
.fallback-zone-label {
font-size: 0.78rem;
font-weight: 500;
color: var(--muted);
text-transform: uppercase;
letter-spacing: 0.03em;
}
.fallback-list {
display: flex;
flex-wrap: wrap;
gap: 8px;
align-items: center;
min-height: 36px;
padding: 4px;
border-radius: var(--radius-sm);
border: 1px dashed transparent;
transition: var(--transition);
}
.fallback-list.sortable-drag-over {
border-color: color-mix(in srgb, var(--accent) 40%, transparent);
background: color-mix(in srgb, var(--accent) 5%, transparent);
}
.fallback-chip {
display: inline-flex;
align-items: center;
gap: 6px;
padding: 6px 12px;
border-radius: 999px;
font-size: 0.82rem;
font-weight: 500;
border: 1px solid color-mix(in srgb, var(--border) 50%, transparent);
background: color-mix(in srgb, var(--fg) 6%, transparent);
color: var(--fg);
cursor: grab;
transition: var(--transition);
user-select: none;
}
.fallback-chip:hover:not(.active):not(.no-drag) { background: color-mix(in srgb, var(--fg) 12%, transparent); }
.fallback-chip.active {
background: color-mix(in srgb, var(--accent) 16%, transparent);
border-color: color-mix(in srgb, var(--accent) 30%, transparent);
color: var(--accent);
cursor: default;
}
.fallback-chip.no-drag { cursor: default; }
.fallback-chip.sortable-ghost {
opacity: 0.4;
}
.fallback-chip.sortable-chosen {
box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}
.fallback-chip.sortable-drag {
cursor: grabbing;
}
.fallback-chip-rank {
display: inline-flex;
align-items: center;
justify-content: center;
width: 20px;
height: 20px;
border-radius: 50%;
font-size: 0.72rem;
font-weight: 700;
background: color-mix(in srgb, var(--fg) 12%, transparent);
color: var(--muted);
flex-shrink: 0;
}
.fallback-chip.active .fallback-chip-rank {
background: color-mix(in srgb, var(--accent) 25%, transparent);
color: var(--accent);
}
.fallback-chip-label { max-width: 120px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.fallback-chip-provider { font-size: 0.75rem; color: var(--muted); }
.fallback-chip.active .fallback-chip-provider { color: var(--accent); opacity: 0.8; }
.fallback-chip-badge {
font-size: 0.7rem;
padding: 2px 6px;
border-radius: 999px;
background: color-mix(in srgb, var(--warning) 20%, transparent);
color: var(--warning);
font-weight: 600;
}
.fallback-chip-btn {
width: 24px;
height: 24px;
border-radius: 50%;
display: flex;
align-items: center;
justify-content: center;
background: color-mix(in srgb, var(--fg) 10%, transparent);
color: var(--muted);
flex-shrink: 0;
margin-left: 2px;
}
.fallback-chip-btn:hover:not(:disabled) { background: color-mix(in srgb, var(--fg) 18%, transparent); color: var(--fg); }
.fallback-chip-btn:disabled { opacity: 0.35; cursor: not-allowed; }
.fallback-chip-btn svg { width: 14px; height: 14px; }
.fallback-empty { font-size: 0.85rem; color: var(--muted); font-style: italic; }

    .card-test-row { display: flex; align-items: center; gap: 8px; min-height: 20px; }
    .test-status { font-size: 0.78rem; display: inline-flex; align-items: center; gap: 4px; animation: fadeIn 0.2s ease-out; }
    .test-status.success { color: var(--vscode-testing-iconPassed, #4ec9b0); }
    .test-status.error { color: var(--vscode-testing-iconFailed, #f14c4c); }
    .test-status svg { width: 14px; height: 14px; flex-shrink: 0; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .test-spinner { width: 14px; height: 14px; border: 2px solid var(--muted); border-top: 2px solid transparent; border-radius: 50%; animation: spin 0.6s linear infinite; flex-shrink: 0; }
    .icon-btn.testing { pointer-events: none; opacity: 0.6; }

    .card-actions { display: flex; justify-content: flex-end; align-items: center; gap: 8px; margin-top: auto; padding-top: 8px; flex-wrap: wrap; }
    .icon-btn {
      width: 32px;
      height: 32px;
      border-radius: var(--radius-sm);
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--muted);
      transition: var(--transition);
    }
    .icon-btn svg { width: 18px; height: 18px; flex-shrink: 0; }
    .icon-btn:hover:not(:disabled) { background: color-mix(in srgb, var(--fg) 10%, transparent); color: var(--fg); }
    .icon-btn.danger:hover:not(:disabled) { background: var(--danger-bg); color: var(--danger); }

    .empty {
      display: none;
      text-align: center;
      padding: 64px 24px;
      background: var(--card-bg);
      border-radius: var(--radius-xl);
      border: 1px dashed var(--border);
    }
    .empty.active { display: flex; flex-direction: column; align-items: center; gap: 16px; }
    .empty h2 { font-size: 1.25rem; }
    .empty p { color: var(--muted); max-width: 400px; }

    .overlay {
      display: none;
      position: fixed;
      inset: 0;
      z-index: 100;
      background: var(--overlay-bg);
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
      align-items: center;
      justify-content: center;
      padding: 24px;
    }
    .overlay.active { display: flex; animation: fadeIn 0.2s ease-out; }
    .modal {
      background: var(--bg);
      border: 1px solid var(--border);
      border-radius: var(--radius-xl);
      box-shadow: var(--shadow-lg);
      width: 100%;
      max-width: 900px;
      max-height: 90vh;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      animation: modalScale 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.1) forwards;
    }
    .modal-header {
      padding: 24px 32px;
      border-bottom: 1px solid color-mix(in srgb, var(--border) 50%, transparent);
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-shrink: 0;
    }
    .modal-header h2 { font-size: 1.25rem; font-weight: 600; margin-bottom: 4px; }
    .modal-header p { font-size: 0.9rem; color: var(--muted); }
    .close-btn { width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: var(--muted); }
    .close-btn:hover { background: color-mix(in srgb, var(--fg) 10%, transparent); color: var(--fg); }

    .modal-body { display: grid; grid-template-columns: 280px 1fr; flex: 1; min-height: 0; }
    .confirm-overlay { z-index: 120; }
    .confirm-modal {
      width: min(440px, 100%);
      background: var(--bg);
      border: 1px solid color-mix(in srgb, var(--danger) 28%, var(--border));
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow-lg);
      padding: 24px;
      display: grid;
      grid-template-columns: 44px 1fr;
      gap: 16px;
      animation: modalScale 0.24s cubic-bezier(0.175, 0.885, 0.32, 1.1) forwards;
    }
    .confirm-icon {
      width: 44px;
      height: 44px;
      border-radius: var(--radius-md);
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--danger);
      background: var(--danger-bg);
      border: 1px solid color-mix(in srgb, var(--danger) 25%, transparent);
    }
    .confirm-content { min-width: 0; display: flex; flex-direction: column; gap: 10px; }
    .confirm-content h2 { font-size: 1.1rem; line-height: 1.25; font-weight: 650; }
    .confirm-content p { color: var(--muted); font-size: 0.9rem; line-height: 1.55; }
    .confirm-profile {
      padding: 12px;
      border-radius: var(--radius-md);
      background: color-mix(in srgb, var(--fg) 6%, transparent);
      border: 1px solid color-mix(in srgb, var(--border) 45%, transparent);
    }
    .confirm-profile-name { font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .confirm-profile-meta { margin-top: 2px; color: var(--muted); font-size: 0.8rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .confirm-actions {
      grid-column: 1 / -1;
      display: flex;
      justify-content: flex-end;
      gap: 10px;
      padding-top: 4px;
    }
    .pane-providers {
      background: var(--card-bg);
      border-right: 1px solid color-mix(in srgb, var(--border) 50%, transparent);
      display: flex;
      flex-direction: column;
      min-height: 0;
    }
    .pane-header { padding: 20px 24px 12px; flex-shrink: 0; }
    .pane-header .section-label { font-size: 0.85rem; font-weight: 600; text-transform: uppercase; color: var(--muted); letter-spacing: 0.05em; }
    .providers { flex: 1; overflow-y: auto; padding: 0 12px 20px; display: flex; flex-direction: column; gap: 4px; }
    .provider {
      text-align: left;
      padding: 12px 16px;
      border-radius: var(--radius-md);
      border: 1px solid transparent;
      display: flex;
      flex-direction: column;
      gap: 4px;
      transition: var(--transition);
      flex-shrink: 0;
    }
    .provider:hover { background: color-mix(in srgb, var(--fg) 5%, transparent); }
    .provider.active {
      background: color-mix(in srgb, var(--accent) 10%, transparent);
      border-color: color-mix(in srgb, var(--accent) 30%, transparent);
    }
    .provider-title { font-weight: 600; font-size: 0.95rem; color: var(--fg); }
    .provider.active .provider-title { color: var(--accent); }
    .provider-desc { font-size: 0.8rem; color: var(--muted); display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }

    .pane-form {
      padding: 24px 32px;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 20px;
      min-height: 0;
    }
    .field { display: flex; flex-direction: column; gap: 8px; flex-shrink: 0; }
    .field label { font-size: 0.9rem; font-weight: 500; }
    .field input {
      width: 100%;
      padding: 10px 12px;
      font-size: 0.95rem;
      background: var(--vscode-input-background);
      color: var(--vscode-input-foreground);
      border: 1px solid var(--vscode-input-border);
      border-radius: var(--radius-sm);
      transition: border-color var(--transition);
    }
    .field input:focus { outline: none; border-color: var(--accent); box-shadow: 0 0 0 1px var(--accent); }
    .hint { font-size: 0.8rem; color: var(--muted); }
    .secret-status {
      display: none;
      padding: 10px 12px;
      border-radius: var(--radius-sm);
      border: 1px solid color-mix(in srgb, var(--accent) 28%, transparent);
      background: color-mix(in srgb, var(--accent) 10%, transparent);
      color: var(--fg);
      font-size: 0.82rem;
      line-height: 1.45;
    }
    .secret-status.active { display: block; }
    .secret-status.warning {
      border-color: color-mix(in srgb, var(--warning) 34%, transparent);
      background: var(--warning-bg);
    }
    .error {
      display: none;
      padding: 12px 16px;
      background: var(--danger-bg);
      color: var(--danger);
      border-radius: var(--radius-sm);
      border: 1px solid color-mix(in srgb, var(--danger) 30%, transparent);
      font-size: 0.9rem;
      flex-shrink: 0;
    }
    .error.active { display: block; animation: fadeIn 0.3s ease; }
    .form-actions { margin-top: auto; padding-top: 24px; display: flex; justify-content: flex-end; gap: 12px; flex-shrink: 0; }

    @media (max-width: 900px) {
      .hero { flex-direction: column; align-items: stretch; }
      .toolbar { flex-direction: column; align-items: stretch; }
      .toolbar-actions { justify-content: space-between; }
      .modal-body { grid-template-columns: 1fr; }
      .confirm-modal { grid-template-columns: 1fr; }
      .confirm-actions { flex-direction: column-reverse; }
      .confirm-actions .btn { width: 100%; }
      .pane-providers {
        border-right: none;
        border-bottom: 1px solid color-mix(in srgb, var(--border) 50%, transparent);
        height: 250px;
        flex: none;
      }
    }
  `;
}

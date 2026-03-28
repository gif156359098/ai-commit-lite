export function buildProfileManagerPanelStyles(): string {
  return `
    :root {
      /* 原生 VS Code 变量映射与增强 */
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
      
      --radius-sm: 6px;
      --radius-md: 12px;
      --radius-lg: 16px;
      --radius-xl: 24px;
      
      --shadow-sm: 0 4px 12px rgba(0, 0, 0, 0.08);
      --shadow-lg: 0 24px 48px rgba(0, 0, 0, 0.16);
      
      --transition: 0.2s cubic-bezier(0.2, 0.8, 0.2, 1);
    }

    /* 基础重置 */
    * { box-sizing: border-box; margin: 0; padding: 0; }
    html, body { min-height: 100vh; background: var(--bg); color: var(--fg); font-family: var(--vscode-font-family); }
    body { padding: 32px; line-height: 1.5; }
    button, input { font: inherit; appearance: none; border: none; background: none; }
    button { cursor: pointer; transition: var(--transition); }
    
    /* 优化的滚动条 */
    ::-webkit-scrollbar { width: 8px; height: 8px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: color-mix(in srgb, var(--fg) 20%, transparent); border-radius: 4px; }
    ::-webkit-scrollbar-thumb:hover { background: color-mix(in srgb, var(--fg) 30%, transparent); }

    /* 动画 */
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes slideUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes modalScale { from { opacity: 0; transform: scale(0.96) translateY(10px); } to { opacity: 1; transform: scale(1) translateY(0); } }

    .shell { max-width: 1200px; margin: 0 auto; display: flex; flex-direction: column; gap: 32px; animation: fadeIn 0.4s ease-out; }

    /* Hero 头部区 */
    .hero { 
      display: flex; justify-content: space-between; align-items: flex-end; gap: 24px;
      padding-bottom: 24px; border-bottom: 1px solid color-mix(in srgb, var(--border) 50%, transparent);
    }
    .hero-content { display: flex; flex-direction: column; gap: 8px; }
    .eyebrow { font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.1em; color: var(--accent); font-weight: 600; }
    .title { font-size: clamp(2rem, 4vw, 2.5rem); font-weight: 700; line-height: 1.1; margin: 0; }
    .subtitle { color: var(--muted); font-size: 1.05rem; max-width: 600px; }
    
    .stats { display: flex; gap: 16px; }
    .stat { 
      background: var(--card-bg); padding: 16px 20px; border-radius: var(--radius-lg);
      border: 1px solid color-mix(in srgb, var(--border) 50%, transparent);
      min-width: 140px;
    }
    .stat-label { font-size: 0.8rem; color: var(--muted); margin-bottom: 4px; }
    .stat-value { font-size: 1.25rem; font-weight: 600; }

    /* 工具栏 */
    .toolbar { display: flex; justify-content: space-between; align-items: center; }
    .toolbar-count { font-size: 0.9rem; color: var(--muted); font-weight: 500; }

    /* 通用按钮 */
    .btn { 
      display: inline-flex; align-items: center; justify-content: center; gap: 8px;
      padding: 8px 16px; border-radius: var(--radius-sm); font-size: 0.9rem; font-weight: 500;
      background: color-mix(in srgb, var(--fg) 8%, transparent); color: var(--fg);
      border: 1px solid color-mix(in srgb, var(--border) 50%, transparent);
    }
    .btn:hover { background: color-mix(in srgb, var(--fg) 15%, transparent); }
    .btn.primary { background: var(--accent-bg); color: var(--accent-fg); border-color: transparent; }
    .btn.primary:hover { background: var(--accent-hover); }
    .btn svg { width: 16px; height: 16px; flex-shrink: 0; }

    /* 卡片网格 */
    .cards { display: grid; grid-template-columns: repeat(auto-fill, minmax(360px, 1fr)); gap: 20px; }
    
    .card { 
      background: var(--card-bg); border-radius: var(--radius-lg); padding: 24px;
      border: 1px solid color-mix(in srgb, var(--border) 50%, transparent);
      display: flex; flex-direction: column; gap: 16px;
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
    
    /* 修复 1：Pill 标签样式，防止折行和图标挤压 */
    .pill { 
      padding: 4px 10px; border-radius: 99px; font-size: 0.75rem; font-weight: 500;
      background: color-mix(in srgb, var(--fg) 8%, transparent); color: var(--muted);
      display: inline-flex; align-items: center; gap: 4px;
      white-space: nowrap; /* 强制不换行 */
      flex-shrink: 0;      /* 防止被左侧标题挤压 */
    }
    .pill svg { width: 14px; height: 14px; flex-shrink: 0; }
    .card.active .pill { background: color-mix(in srgb, var(--accent) 15%, transparent); color: var(--accent); }
    
    .desc { font-size: 0.9rem; color: var(--muted); line-height: 1.6; }
    
    .meta-grid { 
      display: grid; grid-template-columns: max-content 1fr; gap: 8px 16px; 
      background: color-mix(in srgb, var(--bg) 50%, transparent); padding: 12px; border-radius: var(--radius-md);
    }
    .meta-grid .label { font-size: 0.8rem; color: var(--muted); }
    .meta-grid .value { font-size: 0.85rem; font-weight: 500; word-break: break-all; }
    
    .card-actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: auto; padding-top: 8px; }
    
    /* 修复 2：Icon 按钮尺寸，留出安全的 Hover 内边距 */
    .icon-btn { 
      width: 32px; height: 32px; border-radius: var(--radius-sm); 
      display: flex; align-items: center; justify-content: center;
      color: var(--muted); transition: var(--transition);
    }
    .icon-btn svg { width: 18px; height: 18px; flex-shrink: 0; } /* 限制图标大小，留出 7px padding */
    .icon-btn:hover { background: color-mix(in srgb, var(--fg) 10%, transparent); color: var(--fg); }
    .icon-btn.danger:hover { background: var(--danger-bg); color: var(--danger); }

    /* 空状态 */
    .empty { 
      display: none; text-align: center; padding: 64px 24px; background: var(--card-bg); 
      border-radius: var(--radius-xl); border: 1px dashed var(--border);
    }
    .empty.active { display: flex; flex-direction: column; align-items: center; gap: 16px; }
    .empty h2 { font-size: 1.25rem; }
    .empty p { color: var(--muted); max-width: 400px; }

    /* 模态框 (表单) */
    .overlay { 
      display: none; position: fixed; inset: 0; z-index: 100;
      background: var(--overlay-bg); backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px);
      align-items: center; justify-content: center; padding: 24px;
    }
    .overlay.active { display: flex; animation: fadeIn 0.2s ease-out; }
    
    .modal { 
      background: var(--bg); border: 1px solid var(--border); border-radius: var(--radius-xl);
      box-shadow: var(--shadow-lg); width: 100%; max-width: 900px; max-height: 90vh;
      display: flex; flex-direction: column; overflow: hidden;
      animation: modalScale 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.1) forwards;
    }
    
    .modal-header { 
      padding: 24px 32px; border-bottom: 1px solid color-mix(in srgb, var(--border) 50%, transparent);
      display: flex; justify-content: space-between; align-items: center; flex-shrink: 0;
    }
    .modal-header h2 { font-size: 1.25rem; font-weight: 600; margin-bottom: 4px;}
    .modal-header p { font-size: 0.9rem; color: var(--muted); }
    .close-btn { width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: var(--muted); }
    .close-btn:hover { background: color-mix(in srgb, var(--fg) 10%, transparent); color: var(--fg); }

    /* 修复 3：为 grid 和 flex 容器加上 min-height: 0，打破无限延伸，恢复滚动条 */
    .modal-body { 
      display: grid; grid-template-columns: 280px 1fr; 
      flex: 1; min-height: 0; /* 关键修复：允许子元素溢出滚动 */
    }
    
    /* 左侧 Provider 列表 */
    .pane-providers { 
      background: var(--card-bg); border-right: 1px solid color-mix(in srgb, var(--border) 50%, transparent);
      display: flex; flex-direction: column;
      min-height: 0; /* 关键修复 */
    }
    .pane-header { padding: 20px 24px 12px; flex-shrink: 0; }
    .pane-header .section-label { font-size: 0.85rem; font-weight: 600; text-transform: uppercase; color: var(--muted); letter-spacing: 0.05em; }
    
    .providers { flex: 1; overflow-y: auto; padding: 0 12px 20px; display: flex; flex-direction: column; gap: 4px; }
    .provider { 
      text-align: left; padding: 12px 16px; border-radius: var(--radius-md); border: 1px solid transparent;
      display: flex; flex-direction: column; gap: 4px; transition: var(--transition); flex-shrink: 0;
    }
    .provider:hover { background: color-mix(in srgb, var(--fg) 5%, transparent); }
    .provider.active { 
      background: color-mix(in srgb, var(--accent) 10%, transparent); 
      border-color: color-mix(in srgb, var(--accent) 30%, transparent);
    }
    .provider-title { font-weight: 600; font-size: 0.95rem; color: var(--fg); }
    .provider.active .provider-title { color: var(--accent); }
    .provider-desc { font-size: 0.8rem; color: var(--muted); display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }

    /* 右侧表单区 */
    .pane-form { 
      padding: 24px 32px; overflow-y: auto; display: flex; flex-direction: column; gap: 20px; 
      min-height: 0; /* 关键修复 */
    }
    
    .field { display: flex; flex-direction: column; gap: 8px; flex-shrink: 0; }
    .field label { font-size: 0.9rem; font-weight: 500; }
    .field input { 
      width: 100%; padding: 10px 12px; font-size: 0.95rem;
      background: var(--vscode-input-background); color: var(--vscode-input-foreground);
      border: 1px solid var(--vscode-input-border); border-radius: var(--radius-sm);
      transition: border-color var(--transition);
    }
    .field input:focus { outline: none; border-color: var(--accent); box-shadow: 0 0 0 1px var(--accent); }
    .hint { font-size: 0.8rem; color: var(--muted); }
    
    .error { 
      display: none; padding: 12px 16px; background: var(--danger-bg); color: var(--danger); 
      border-radius: var(--radius-sm); border: 1px solid color-mix(in srgb, var(--danger) 30%, transparent);
      font-size: 0.9rem; flex-shrink: 0;
    }
    .error.active { display: block; animation: fadeIn 0.3s ease; }

    .form-actions { margin-top: auto; padding-top: 24px; display: flex; justify-content: flex-end; gap: 12px; flex-shrink: 0; }

    /* 响应式 */
    @media (max-width: 900px) {
      .hero { flex-direction: column; align-items: stretch; }
      .modal-body { grid-template-columns: 1fr; }
      .pane-providers { 
        border-right: none; border-bottom: 1px solid color-mix(in srgb, var(--border) 50%, transparent); 
        height: 250px; flex: none; /* 移动端限制固定高度并允许滚动 */
      }
    }
  `;
}
# AI Commit Lite

用 AI 为你的 Git 提交生成高质量提交信息

[简体中文](#简体中文) | [English](#english)

---

## 简体中文

### 功能预览

![Profile 管理](docs/images/01.png)
![生成提交信息](docs/images/02.png)

### 快速上手

只需 3 步，即可开始生成提交信息：

**1 安装扩展**
安装后如果没有 Profile，右下角会弹出引导提示。

**2 配置 AI**
点击「新增 Profile」→「选择供应商」→「填入 API Key」
（密钥安全存储在 VS Code 中，不会写入普通设置）

**3 生成提交**
```bash
git add .
```
然后使用任意方式生成：
- 命令面板：`AI Commit Lite: Generate Commit`
- SCM 标题按钮
- `Ctrl+Shift+G Ctrl+Shift+C`

生成完成后，提交信息会自动填入 Source Control 输入框。

### 它能做什么

**Q: 支持哪些 AI 供应商？**
支持 OpenAI、DeepSeek、Gemini、Anthropic、Cohere、Mistral、DashScope，以及 OpenAI 兼容的 API。

**Q: API 密钥安全吗？**
是的，密钥存在 VS Code Secret Storage 中，不会明文暴露在设置里。

**Q: 可以同时用多个 AI 配置吗？**
可以。Profile 管理器支持创建多个配置（比如不同团队的账号），并可设置自动回退顺序。

**Q: 生成格式可以调整吗？**
支持 `detailed`（详细版，带要点列表）和 `concise`（简洁版，单行标题）两种风格。

**Q: 支持多语言输出吗？**
支持 10 种语言：英语、简体中文、日语、韩语、西班牙语、法语、德语、俄语、葡萄牙语、意大利语。

### 支持的供应商

| 供应商 | 说明 |
| --- | --- |
| OpenAI | OpenAI 官方模型 |
| DeepSeek | DeepSeek 官方模型 |
| Gemini | Google Gemini |
| Anthropic | Claude 系列 |
| Cohere | Command 等 |
| Mistral | Mistral 官方模型 |
| DashScope | 阿里云通义千问 |
| Azure OpenAI | Azure 部署的 OpenAI |
| OpenAI-Compatible | OpenRouter、自托管服务等 |

*需要自定义 Endpoint：Azure OpenAI、OpenAI-Compatible*

> 各供应商默认模型（在 Profile 管理中可修改）：OpenAI `gpt-5.6-terra`、DeepSeek `deepseek-v4-flash`、Gemini `gemini-3.8-flash`、Anthropic `claude-sonnet-4-6`、Cohere `command-a-plus-05-2026`、Mistral `mistral-small-latest`、DashScope `qwen-plus`。
>
> ⚠️ 旧模型退役提示：DeepSeek `deepseek-chat`/`deepseek-reasoner`（2026-07-24 已退役）与 Anthropic `claude-sonnet-4-20250514`（2026-06-15 已退役）已在官方下线，请勿继续在 Profile 中使用；OpenAI 新一代模型（GPT-5+ 系列）由扩展自动适配参数。

### 常用命令

| 命令 | 说明 |
| --- | --- |
| `AI Commit Lite: Generate Commit` | 生成提交信息 |
| `AI Commit Lite: Open Profile Manager` | 打开配置管理 |
| `AI Commit Lite: Switch Profile` | 切换当前 Profile |
| `AI Commit Lite: Add Profile` | 新增配置 |
| `AI Commit Lite: Edit Profile` | 编辑配置 |
| `AI Commit Lite: Delete Profile` | 删除配置 |

**快捷键**: `Ctrl+Shift+G Ctrl+Shift+C` (Windows/Linux), `Cmd+Shift+G Cmd+Shift+C` (macOS)

### 重要设置项

| 设置项 | 默认值 | 说明 |
| --- | --- | --- |
| `language` | `en` | 提交信息语言 |
| `useGitmoji` | `true` | 是否使用 Gitmoji |
| `commitMessageStyle` | `detailed` | `detailed`（详细版）或 `concise`（简洁版） |
| `enableAutoFallback` | `true` | 启用自动回退到备用 Profile |
| `profileFallbackOrder` | `[]` | 回退优先级顺序 |
| `maxDiffCharacters` | `24000` | 总体 diff 上下文上限 |
| `maxFileDiffCharacters` | `8000` | 单文件 diff 上限 |

[查看所有设置项 →](./docs/settings.md)

### 常见问题

**没有看到 Profile？**
- 检查状态栏是否有「AI Commit Lite」
- 或执行 `AI Commit Lite: Open Profile Manager`

**提示没有暂存变更？**
请先执行 `git add .` 把文件加入暂存区。

**生成太慢？**
- 减少大文件和二进制文件进入暂存区
- 调整 `contextExcludePatterns` 排除更多文件

**遇到限流或配额不足？**
1. 确保 `enableAutoFallback` 已启用
2. 在 Profile 管理器中为卡片设置回退优先级

**推理模型返回格式不对？**
保持 `commitMessageStyle = detailed`，扩展会自动修正格式。

**多仓库（Multi-root）场景怎么工作？**
- 点击 SCM 标题栏按钮会精确作用于你点击的那个仓库；
- 命令面板 / 快捷键触发时按「活动编辑器 → 单工作区文件夹 → 弹选择器」的顺序定位；
- 默认排除列表已包含 .env、私钥（*.pem/*.key）、AWS/SSH 凭据等敏感文件，避免误暂存时外送；你也可以在 `contextExcludePatterns` 中追加。

---

## 开发者信息

**要求**: Node.js 18+、VS Code 1.80+

**常用命令**:
```bash
npm run compile   # 编译
npm run watch      # 监听模式
npm run lint       # 检查
npm test           # 测试
npm run package    # 打包
```

### 接下来

如果你是中文用户，可以查看独立的中文文档：

[简体中文独立版](README.zh-cn.md)

### License

[MIT](LICENSE)

---

## English

AI Commit Lite uses AI to generate high-quality commit messages for your Git commits.

[简体中文](#简体中文) | [English](#english)

### Feature Overview

![Profile Management](docs/images/01.png)
![Generate Commit](docs/images/02.png)

### Quick Start

Get started in just 3 steps:

**1 Install the Extension**
After installation, an onboarding prompt will appear if no Profile exists.

**2 Configure AI**
Click "Add Profile" → "Select Provider" → "Enter API Key"
(Keys are securely stored in VS Code Secret Storage, never in plain settings)

**3 Generate Commit**
```bash
git add .
```
Then generate using any method:
- Command Palette: `AI Commit Lite: Generate Commit`
- SCM title button
- `Ctrl+Shift+G Ctrl+Shift+C`

After generation, the commit message is automatically filled into the Source Control input box.

### What Can It Do

**Q: Which AI providers are supported?**
OpenAI, DeepSeek, Gemini, Anthropic, Cohere, Mistral, DashScope, and OpenAI-compatible APIs.

**Q: Is my API key secure?**
Yes, keys are stored in VS Code Secret Storage, never exposed in plain settings.

**Q: Can I use multiple AI configurations simultaneously?**
Yes. Profile Manager supports creating multiple configurations (e.g., accounts for different teams) with automatic fallback order.

**Q: Can I adjust the output format?**
Supports `detailed` (with bullet points) and `concise` (single line) styles.

**Q: Does it support multilingual output?**
Yes, 10 languages: English, Simplified Chinese, Japanese, Korean, Spanish, French, German, Russian, Portuguese, and Italian.

### Supported Providers

| Provider | Description |
| --- | --- |
| OpenAI | Official OpenAI models |
| DeepSeek | Official DeepSeek models |
| Gemini | Google Gemini |
| Anthropic | Claude series |
| Cohere | Command and more |
| Mistral | Official Mistral models |
| DashScope | Alibaba Cloud Qwen |
| Azure OpenAI | OpenAI deployed on Azure |
| OpenAI-Compatible | OpenRouter, self-hosted services, etc. |

*Custom endpoint required: Azure OpenAI, OpenAI-Compatible*

> Default models (changeable in Profile Manager): OpenAI `gpt-5.6-terra`, DeepSeek `deepseek-v4-flash`, Gemini `gemini-3.8-flash`, Anthropic `claude-sonnet-4-6`, Cohere `command-a-plus-05-2026`, Mistral `mistral-small-latest`, DashScope `qwen-plus`.
>
> ⚠️ Retired model names: DeepSeek `deepseek-chat`/`deepseek-reasoner` (retired 2026-07-24) and Anthropic `claude-sonnet-4-20250514` (retired 2026-06-15) are no longer available; remove them from your profiles. OpenAI's next-generation models (GPT-5+) are handled automatically by the extension.

### Commands

| Command | Description |
| --- | --- |
| `AI Commit Lite: Generate Commit` | Generate commit message |
| `AI Commit Lite: Open Profile Manager` | Open profile management |
| `AI Commit Lite: Switch Profile` | Switch current Profile |
| `AI Commit Lite: Add Profile` | Add new profile |
| `AI Commit Lite: Edit Profile` | Edit profile |
| `AI Commit Lite: Delete Profile` | Delete profile |

**Shortcut**: `Ctrl+Shift+G Ctrl+Shift+C` (Windows/Linux), `Cmd+Shift+G Cmd+Shift+C` (macOS)

### Important Settings

| Setting | Default | Description |
| --- | --- | --- |
| `language` | `en` | Commit message language |
| `useGitmoji` | `true` | Use Gitmoji prefix |
| `commitMessageStyle` | `detailed` | `detailed` or `concise` format |
| `enableAutoFallback` | `true` | Enable automatic fallback to backup profiles |
| `profileFallbackOrder` | `[]` | Fallback priority order |
| `maxDiffCharacters` | `24000` | Total diff context limit |
| `maxFileDiffCharacters` | `8000` | Per-file diff limit |

[View all settings →](./docs/settings.md)

### Troubleshooting

**Cannot see Profile?**
- Check if "AI Commit Lite" appears in the status bar
- Or run `AI Commit Lite: Open Profile Manager`

**Says no staged changes?**
Run `git add .` to stage files first.

**Generation too slow?**
- Reduce large/binary files in staging area
- Adjust `contextExcludePatterns` to exclude more files

**Hit rate limit or quota?**
1. Make sure `enableAutoFallback` is enabled
2. Set fallback priority on profile cards in Profile Manager

**Multi-root workspaces?**
- Clicking the SCM title button targets exactly the repository you clicked;
- Command Palette / shortcut resolve by "active editor → single workspace folder → picker" in that order;
- The default exclude list already covers `.env`, private keys (`*.pem`/`*.key`), AWS/SSH credentials and similar sensitive files so they are never sent to third-party AI.

**Reasoning model returns wrong format?**
Keep `commitMessageStyle = detailed`, the extension will auto-fix the format.

---

## Developer Information

**Requirements**: Node.js 18+, VS Code 1.80+

**Common Commands**:
```bash
npm run compile   # Compile
npm run watch     # Watch mode
npm run lint      # Lint
npm test          # Test
npm run package   # Package
```

### What's Next

For dedicated documentation, see the standalone version:

[Standalone Documentation (Chinese)](README.zh-cn.md)

### License

[MIT](LICENSE)
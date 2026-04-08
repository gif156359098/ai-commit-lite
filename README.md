# AI Commit Lite

[简体中文](#简体中文) | [English](#english)

Other languages:
[Deutsch](README.de.md) |
[Español](README.es.md) |
[Français](README.fr.md) |
[Italiano](README.it.md) |
[日本語](README.ja.md) |
[한국어](README.ko.md) |
[Português](README.pt.md) |
[Русский](README.ru.md) |
[简体中文独立版](README.zh-cn.md)

---

## 简体中文

AI Commit Lite 是一个 VS Code 扩展，用 AI 根据当前 Git 暂存区变更自动生成提交信息。基于 `Profile 管理` 的多厂商、多模型工作流，更适合在不同模型和供应商之间快速切换。

### 功能特性

- `Profile 管理`：用可视化面板管理多个 AI 厂商配置，不再手动维护单组 API 参数。
- 多供应商支持：OpenAI、Azure OpenAI、DeepSeek、Gemini、Anthropic、Cohere、Mistral、Qwen / DashScope，以及任意 OpenAI-Compatible 服务。
- 安全存储密钥：API Key 保存在 VS Code Secret Storage 中，不会明文写入普通设置。
- 两种提交风格：支持 `detailed` 和 `concise`，默认是更适合追溯历史的详细版。
- 自动格式修正：当模型没有按要求输出详细版结构时，扩展会自动再做一次格式修正。
- 自动回退：当当前 Profile 遇到配额或限流问题时，可自动切换到备用 Profile。
- 多语言输出：支持英语、简体中文、日语、韩语、西班牙语、法语、德语、俄语、葡萄牙语、意大利语。
- Git 差异优化：批量分析暂存变更，减少逐文件串行 diff 带来的等待时间。
- VS Code 集成：支持命令面板、SCM 标题按钮、状态栏入口和快捷键。

### 使用教程

#### 1. 首次打开扩展

- 安装扩展后，如果还没有任何 Profile，右下角会出现引导提示。
- 也可以点击状态栏里的 `AI Commit Lite`，或者在命令面板中执行 `AI Commit Lite: Open Profile Manager`。

#### 2. 新增一个 Profile

1. 打开 `Profile 管理`
2. 点击 `新增 Profile`
3. 选择供应商卡片
4. 填写显示名称、模型名和 API Key
5. 如果你选择的是 `Azure OpenAI` 或 `OpenAI-Compatible`，还需要填写 Endpoint / Base URL
6. 保存后，这个 Profile 就可以被激活使用

说明：

- 编辑已有 Profile 时，如果 `API Key` 留空，会继续保留旧密钥。
- 第一个创建的 Profile 会自动成为当前激活 Profile。

#### 3. 暂存你的代码改动

在生成提交信息之前，请先把要提交的文件放进 Git 暂存区，例如：

```bash
git add .
```

#### 4. 生成提交信息

你可以使用任意一种入口：

- 命令面板：`AI Commit Lite: Generate Commit`
- SCM 面板标题按钮
- 快捷键：`Ctrl+Shift+G Ctrl+Shift+C`
- macOS：`Cmd+Shift+G Cmd+Shift+C`

生成成功后，提交信息会自动写入 Source Control 输入框。

#### 5. 选择你偏好的提交风格

在设置中调整 `aiCommitLite.commitMessageStyle`：

- `detailed`：默认值。输出一行标题，再加 2 到 5 条要点，适合以后回溯变更。
- `concise`：只输出单行标题，适合追求简洁的仓库。

#### 6. 管理多个供应商和回退顺序

- 你可以为不同账号、不同团队、不同模型各建一个 Profile。
- 你可以直接在 `Profile Manager` 的卡片上设置回退优先级，不必再手动编辑数组。
- `aiCommitLite.enableAutoFallback` 仍用于控制是否启用自动回退。
- `aiCommitLite.profileFallbackOrder` 现在表示“优先级列表”：已列出的 Profile 会优先尝试，未列出的其余 Profile 会自动追加在后面。
- 当主 Profile 限流或额度耗尽时，扩展会按这个优先级顺序尝试备用 Profile。

### 支持的供应商

| 供应商 | 适用场景 | 是否需要自定义 Endpoint |
| --- | --- | --- |
| OpenAI | 直接使用 OpenAI 官方模型 | 否 |
| Azure OpenAI | 使用 Azure 上部署的 OpenAI 模型 | 是 |
| DeepSeek | 使用 DeepSeek 官方模型 | 否 |
| Gemini | 使用 Google Gemini 官方模型 | 否 |
| Anthropic | 使用 Claude 官方模型 | 否 |
| Cohere | 使用 Command 等 Cohere 官方模型 | 否 |
| Mistral | 使用 Mistral 官方模型 | 否 |
| Qwen / DashScope | 使用阿里云 DashScope 提供的模型 | 否 |
| OpenAI-Compatible | OpenRouter、SiliconFlow、GLM 兼容网关、自托管兼容服务等 | 是 |

### 重要设置项

| 设置项 | 默认值 | 说明 |
| --- | --- | --- |
| `aiCommitLite.language` | `en` | 生成提交信息的语言 |
| `aiCommitLite.useGitmoji` | `true` | 是否在提交前缀加入 Gitmoji |
| `aiCommitLite.conventionalCommits` | `true` | 是否遵循 Conventional Commits |
| `aiCommitLite.commitMessageStyle` | `detailed` | 详细版或简洁版提交格式 |
| `aiCommitLite.customSystemPrompt` | `""` | 自定义系统提示词 |
| `aiCommitLite.temperature` | `0.7` | 生成温度 |
| `aiCommitLite.maxTokens` | `1000` | 模型输出最大 token 数 |
| `aiCommitLite.maxDiffCharacters` | `24000` | 总体 diff 上下文上限 |
| `aiCommitLite.maxFileDiffCharacters` | `8000` | 单文件 diff 上限 |
| `aiCommitLite.contextExcludePatterns` | 内置默认值 | 分析时排除的文件模式 |
| `aiCommitLite.enableAutoFallback` | `true` | 是否自动切换备用 Profile |
| `aiCommitLite.profileFallbackOrder` | `[]` | 自动回退优先级列表（未列出的 Profile 会自动追加） |
| `aiCommitLite.profiles` | `[]` | Profile 元数据列表 |
| `aiCommitLite.activeProfile` | `""` | 当前激活的 Profile ID |

### 常用命令

- `AI Commit Lite: Generate Commit`
- `AI Commit Lite: Switch Profile`
- `AI Commit Lite: Add Profile`
- `AI Commit Lite: Edit Profile`
- `AI Commit Lite: Delete Profile`
- `AI Commit Lite: Open Profile Manager`

### 故障排查

#### 没有看到 Profile

- 先点击状态栏里的 `AI Commit Lite`
- 或执行 `AI Commit Lite: Open Profile Manager`
- 如果是首次安装且还没有 Profile，扩展会自动弹出引导

#### 点击生成后提示没有暂存变更

请先执行 `git add`，把要提交的文件放进暂存区。

#### 生成太慢

- 优先减少大体积生成文件、锁文件和二进制文件进入暂存区
- 按需调整 `aiCommitLite.contextExcludePatterns`
- 适当降低 `aiCommitLite.maxDiffCharacters`

#### 推理模型返回格式不稳定

- 保持 `aiCommitLite.commitMessageStyle = detailed`
- 适当提高 `aiCommitLite.maxTokens`
- 如果某些推理模型仍然只返回单行，扩展会自动做一次格式修正

### 开发

#### 环境要求

- Node.js 18+
- VS Code 1.80+

#### 常用命令

```bash
npm run compile
npm run watch
npm run lint
npm test
npm run package
```

说明：当前仓库已经内置 `npm test`，会先编译测试目标，再运行 Node 原生测试。

### License

[MIT](LICENSE)

---

## English

AI Commit Lite is a VS Code extension that uses AI to generate commit messages from your staged Git changes. The current version has moved from the old single-provider settings flow to a profile-based workflow, so it is easier to manage multiple vendors, models, teams, and backup accounts.

### Features

- `Profile Manager`: manage multiple AI connections in a visual panel instead of maintaining one global provider config.
- Multi-provider support: OpenAI, Azure OpenAI, DeepSeek, Gemini, Anthropic, Cohere, Mistral, Qwen / DashScope, and any OpenAI-compatible service.
- Secure API key storage: API keys are stored in VS Code Secret Storage rather than plain extension settings.
- Two commit styles: `detailed` and `concise`, with `detailed` as the default.
- Automatic format repair: if a model does not follow the required detailed format, the extension runs one repair pass automatically.
- Automatic fallback: switch to backup profiles when the active profile hits rate limits or quota issues.
- Multilingual output: English, Simplified Chinese, Japanese, Korean, Spanish, French, German, Russian, Portuguese, and Italian.
- Faster diff preparation: staged changes are analyzed in batches instead of one file at a time.
- Native VS Code integration: command palette, SCM title button, status bar entry, and keyboard shortcut.

### Installation

#### Option 1: Install a `.vsix`

1. Run `Extensions: Install from VSIX...` in VS Code
2. Select the packaged `.vsix` file

#### Option 2: Build from source

```bash
git clone https://github.com/gif156359098/ai-commit-lite.git
cd ai-commit-lite
npm install
npm run compile
npm run package
```

Then install the generated `.vsix` in VS Code.

### Tutorial

#### 1. Open the extension for the first time

- After installation, the extension shows an onboarding prompt if no profile exists yet.
- You can also click `AI Commit Lite` in the status bar or run `AI Commit Lite: Open Profile Manager`.

#### 2. Create a profile

1. Open `Profile Manager`
2. Click `Add Profile`
3. Pick a provider card
4. Enter a display name, model name, and API key
5. If you choose `Azure OpenAI` or `OpenAI-Compatible`, also enter the endpoint / base URL
6. Save the profile and make it active

Notes:

- When editing a profile, leaving the API key field empty keeps the existing secret.
- The first profile you create becomes the active profile automatically.

#### 3. Stage the code you want to commit

Before generating a commit message, put the target files into the Git staging area:

```bash
git add .
```

#### 4. Generate a commit message

Use any of these entry points:

- Command Palette: `AI Commit Lite: Generate Commit`
- SCM title button
- Shortcut on Windows / Linux: `Ctrl+Shift+G Ctrl+Shift+C`
- Shortcut on macOS: `Cmd+Shift+G Cmd+Shift+C`

After generation, the commit message is written into the Source Control input box automatically.

#### 5. Choose your preferred commit style

Set `aiCommitLite.commitMessageStyle` in VS Code settings:

- `detailed`: default. Generates a subject line plus 2 to 5 bullet points.
- `concise`: generates only a single-line subject.

#### 6. Manage multiple vendors and fallback order

- Create separate profiles for different teams, accounts, or model vendors.
- You can adjust fallback priority directly on the profile cards in `Profile Manager` instead of editing an array by hand.
- `aiCommitLite.enableAutoFallback` still controls whether automatic fallback is enabled.
- `aiCommitLite.profileFallbackOrder` now behaves as a priority list: listed profiles are tried first, and any remaining profiles are appended automatically.
- When the primary profile hits a quota or rate limit, the extension follows that priority order for backup profiles.

### Supported Providers

| Provider | Typical use case | Custom endpoint required |
| --- | --- | --- |
| OpenAI | Direct access to official OpenAI models | No |
| Azure OpenAI | OpenAI models deployed in Azure | Yes |
| DeepSeek | Official DeepSeek models | No |
| Gemini | Official Google Gemini models | No |
| Anthropic | Official Claude models | No |
| Cohere | Official Cohere / Command models | No |
| Mistral | Official Mistral models | No |
| Qwen / DashScope | Models served by Alibaba Cloud DashScope | No |
| OpenAI-Compatible | OpenRouter, SiliconFlow, compatible GLM gateways, self-hosted compatible services, and similar platforms | Yes |

### Important Settings

| Setting | Default | Description |
| --- | --- | --- |
| `aiCommitLite.language` | `en` | Output language for commit messages |
| `aiCommitLite.useGitmoji` | `true` | Prefix commit messages with Gitmoji |
| `aiCommitLite.conventionalCommits` | `true` | Follow Conventional Commits |
| `aiCommitLite.commitMessageStyle` | `detailed` | Detailed or concise output style |
| `aiCommitLite.customSystemPrompt` | `""` | Custom system prompt |
| `aiCommitLite.temperature` | `0.7` | Model temperature |
| `aiCommitLite.maxTokens` | `1000` | Maximum output tokens |
| `aiCommitLite.maxDiffCharacters` | `24000` | Total diff context budget |
| `aiCommitLite.maxFileDiffCharacters` | `8000` | Per-file diff budget |
| `aiCommitLite.contextExcludePatterns` | built-in defaults | Patterns excluded from diff analysis |
| `aiCommitLite.enableAutoFallback` | `true` | Enable automatic profile fallback |
| `aiCommitLite.profileFallbackOrder` | `[]` | Fallback priority list. Unlisted profiles are appended automatically |
| `aiCommitLite.profiles` | `[]` | Stored profile metadata |
| `aiCommitLite.activeProfile` | `""` | Active profile ID |

### Commands

- `AI Commit Lite: Generate Commit`
- `AI Commit Lite: Switch Profile`
- `AI Commit Lite: Add Profile`
- `AI Commit Lite: Edit Profile`
- `AI Commit Lite: Delete Profile`
- `AI Commit Lite: Open Profile Manager`

### Troubleshooting

#### I cannot find my profiles

- Click `AI Commit Lite` in the status bar
- Or run `AI Commit Lite: Open Profile Manager`
- On first install, the extension shows onboarding automatically when no profile exists

#### The extension says there are no staged changes

Run `git add` first so your target files are in the staging area.

#### Generation feels slow

- Avoid staging large generated files, lockfiles, or binary assets unless needed
- Tune `aiCommitLite.contextExcludePatterns`
- Lower `aiCommitLite.maxDiffCharacters` if your repository is very large

#### Reasoning models return inconsistent formatting

- Keep `aiCommitLite.commitMessageStyle = detailed`
- Increase `aiCommitLite.maxTokens` when necessary
- The extension will run one automatic format-repair pass for detailed mode

### Development

#### Requirements

- Node.js 18+
- VS Code 1.80+

#### Commands

```bash
npm run compile
npm run watch
npm run lint
npm test
npm run package
```

Note: the repository includes `npm test`, which compiles the test targets first and then runs Node-native tests.

### License

[MIT](LICENSE)


# AI Commit Lite

默认文档请见中英双语版 [README.md](README.md)。

AI Commit Lite 是一个 VS Code 扩展，用 AI 根据当前 Git 暂存区变更生成提交信息。当前版本已经改为基于 `Profile 管理` 的工作流，适合同时使用多个模型、多个账号和多个供应商。

## 功能特性

- 可视化 `Profile 管理` 面板
- 支持 OpenAI、Azure OpenAI、DeepSeek、Gemini、Anthropic、Cohere、Mistral、Qwen / DashScope、OpenAI-Compatible
- API Key 使用 VS Code Secret Storage 安全保存
- 支持 `detailed` 和 `concise` 两种提交风格
- 自动格式修正：当模型没有按要求输出详细版结构时，扩展会自动再做一次格式修正
- 支持 Gitmoji 和 Conventional Commits
- 支持自动回退到备用 Profile
- 支持多语言提交信息输出
- Git 差异优化：批量分析暂存变更，减少逐文件串行 diff 带来的等待时间
- 支持状态栏、SCM 标题按钮、命令面板和快捷键入口

## 安装

### 安装 `.vsix`

1. 在 VS Code 中执行 `Extensions: Install from VSIX...`
2. 选择扩展包文件

### 从源码构建

```bash
git clone https://github.com/gif156359098/ai-commit-lite.git
cd ai-commit-lite
npm install
npm run compile
npm run package
```

## 使用教程

### 1. 打开 Profile 管理

你可以通过以下任一入口打开：

- 状态栏 `AI Commit Lite`
- 命令面板：`AI Commit Lite: Open Profile Manager`

如果首次安装后还没有 Profile，扩展会自动弹出引导提示。

### 2. 新增 Profile

1. 点击 `新增 Profile`
2. 选择供应商
3. 填写显示名称
4. 填写模型名
5. 填写 API Key
6. 如果是 `Azure OpenAI` 或 `OpenAI-Compatible`，再填写 Endpoint / Base URL
7. 点击保存

说明：

- 编辑时如果 API Key 留空，会保留旧密钥
- 第一个 Profile 会自动成为当前激活项

### 3. 暂存变更

```bash
git add .
```

### 4. 生成提交信息

可以使用：

- `AI Commit Lite: Generate Commit`
- SCM 标题按钮
- `Ctrl+Shift+G Ctrl+Shift+C`
- macOS：`Cmd+Shift+G Cmd+Shift+C`

生成成功后，提交信息会自动写入 Source Control 输入框。

### 5. 选择提交风格

在设置中调整 `aiCommitLite.commitMessageStyle`：

- `detailed`：一行标题 + 2 到 5 条要点
- `concise`：仅单行标题

如果模型没有按详细版格式输出，扩展会自动再做一次格式修正。

### 6. 管理回退优先级

- 你可以直接在 `Profile Manager` 的卡片上设置回退优先级，不必再手动编辑数组。
- `aiCommitLite.enableAutoFallback` 仍用于控制是否启用自动回退。
- `aiCommitLite.profileFallbackOrder` 现在表示“优先级列表”：已列出的 Profile 会优先尝试，未列出的其余 Profile 会自动追加在后面。
- 当主 Profile 限流或额度耗尽时，扩展会按这个优先级顺序尝试备用 Profile。

## 支持的供应商

| 供应商 | 说明 | 自定义 Endpoint |
| --- | --- | --- |
| OpenAI | 官方 OpenAI 模型 | 否 |
| Azure OpenAI | Azure 上部署的 OpenAI 模型 | 是 |
| DeepSeek | 官方 DeepSeek 模型 | 否 |
| Gemini | 官方 Google Gemini 模型 | 否 |
| Anthropic | 官方 Claude 模型 | 否 |
| Cohere | 官方 Cohere / Command 模型 | 否 |
| Mistral | 官方 Mistral 模型 | 否 |
| Qwen / DashScope | 阿里云 DashScope 模型 | 否 |
| OpenAI-Compatible | OpenRouter、兼容网关、自托管兼容服务等 | 是 |

## 重要设置项

| 设置项 | 默认值 | 说明 |
| --- | --- | --- |
| `aiCommitLite.language` | `en` | 提交语言 |
| `aiCommitLite.useGitmoji` | `true` | 是否使用 Gitmoji |
| `aiCommitLite.conventionalCommits` | `true` | 是否使用 Conventional Commits |
| `aiCommitLite.commitMessageStyle` | `detailed` | 提交风格 |
| `aiCommitLite.customSystemPrompt` | `""` | 自定义系统提示词 |
| `aiCommitLite.temperature` | `0.7` | 生成温度 |
| `aiCommitLite.maxTokens` | `1000` | 最大输出 token |
| `aiCommitLite.maxDiffCharacters` | `24000` | 总 diff 上限 |
| `aiCommitLite.maxFileDiffCharacters` | `8000` | 单文件 diff 上限 |
| `aiCommitLite.contextExcludePatterns` | 内置默认值 | 分析时排除的文件模式 |
| `aiCommitLite.enableAutoFallback` | `true` | 是否自动回退 |
| `aiCommitLite.profileFallbackOrder` | `[]` | 自动回退优先级列表（未列出的 Profile 会自动追加） |
| `aiCommitLite.profiles` | `[]` | Profile 元数据列表 |
| `aiCommitLite.activeProfile` | `""` | 当前激活的 Profile ID |

## 常用命令

- `AI Commit Lite: Generate Commit`
- `AI Commit Lite: Switch Profile`
- `AI Commit Lite: Add Profile`
- `AI Commit Lite: Edit Profile`
- `AI Commit Lite: Delete Profile`
- `AI Commit Lite: Open Profile Manager`

## 故障排查

### 没有 Profile

- 打开 `AI Commit Lite: Open Profile Manager`
- 检查是否至少创建了一个 Profile

### 提示没有暂存变更

请先执行 `git add`。

### 生成较慢

- 减少大文件和二进制文件进入暂存区
- 调整 `aiCommitLite.contextExcludePatterns`
- 适当降低 `aiCommitLite.maxDiffCharacters`

### 遇到限流或额度问题

启用 `aiCommitLite.enableAutoFallback`，并配置 `aiCommitLite.profileFallbackOrder`。

### 推理模型返回格式不稳定

- 保持 `aiCommitLite.commitMessageStyle = detailed`
- 适当提高 `aiCommitLite.maxTokens`
- 如果某些推理模型仍然只返回单行，扩展会自动做一次格式修正

## 开发

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

## License

[MIT](LICENSE)


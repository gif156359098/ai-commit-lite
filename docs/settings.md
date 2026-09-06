# AI Commit Lite 设置项参考

所有设置项位于 `aiCommitLite.*` 命名空间下（设置搜索 `aiCommitLite`）。

> 安全说明：`profiles`、`activeProfile`、`profileFallbackOrder`、`enableAutoFallback`
> 为**仅全局（application scope）**设置，工作区级 `.vscode/settings.json` 无法覆盖它们。
> 这避免了恶意仓库把 profile 的 API 端点重定向到攻击者服务器、从而窃取你的 API key。

## 生成行为

| 设置项 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `language` | string | `en` | 提交信息语言（en/zh-cn/ja/ko/es/fr/de/ru/pt/it） |
| `useGitmoji` | boolean | `true` | 是否添加 Gitmoji 前缀 |
| `conventionalCommits` | boolean | `true` | 是否遵循 Conventional Commits 规范 |
| `commitMessageStyle` | string | `detailed` | `detailed`（标题+要点列表）或 `concise`（单行标题） |
| `temperature` | number | `0.7` | 生成随机性（0~2；OpenAI GPT-5+ 推理模型会自动忽略该参数） |
| `maxTokens` | number | `1000` | 生成最大 token 数（100~4000） |
| `customSystemPrompt` | string | `` | 追加到系统提示的自定义指令 |

## Diff 上下文预算

| 设置项 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `maxDiffCharacters` | number | `24000` | 发送给 AI 的 diff 总字符上限 |
| `maxFileDiffCharacters` | number | `8000` | 单个文件 diff 字符上限 |
| `contextExcludePatterns` | string[] | 见默认 | 排除的文件 glob 列表。默认已排除锁文件、二进制/构建产物，以及 **`.env`、私钥（`*.pem`/`*.key`）、AWS/SSH 凭据等敏感文件**，避免误暂存时外送 |

## Profile 与回退

| 设置项 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `profiles` | object[] | `[]` | Profile 列表（**仅全局**）。每个包含 id/label/provider/model/baseUrl |
| `activeProfile` | string | `` | 当前使用的 Profile id（**仅全局**） |
| `enableAutoFallback` | boolean | `true` | 主 profile 失败时自动回退到备用 profile（**仅全局**） |
| `profileFallbackOrder` | string[] | `[]` | 回退优先级（**仅全局**） |

API key 不存储在上述设置中：它们保存在 VS Code Secret Storage（扩展隔离的加密存储）。

## Provider 与端点安全

- 官方 provider（OpenAI/DeepSeek/Gemini/Anthropic/Cohere/Mistral）的端点不可自定义；
- Azure / DashScope / OpenAI-Compatible 可自定义 `baseUrl`，**必须使用 https://**
  （本机开发服务如 Ollama/LM Studio 允许 http://localhost）；
- Azure 的 `api-version` 已内置为 `2025-04-01-preview`；若你的端点自己带 `api-version` 参数则优先使用你的值。

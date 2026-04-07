# AI Commit Lite

既定の中英バイリンガル版は [README.md](README.md) を参照してください。

AI Commit Lite は、現在の Git ステージ済み変更から AI でコミットメッセージを生成する VS Code 拡張です。現在は旧来の単一プロバイダー設定ではなく、`Profile Manager` を中心に複数ベンダーと複数モデルを管理するワークフローになっています。

## 主な機能

- ビジュアルな `Profile Manager`
- OpenAI、Azure OpenAI、DeepSeek、Gemini、Anthropic、Cohere、Mistral、Qwen / DashScope、OpenAI-Compatible をサポート
- API キーは VS Code Secret Storage に安全に保存
- `detailed` と `concise` の 2 種類のコミットスタイル
- 自動フォーマット修正：モデルが要求された詳細形式に従わない場合、拡張機能が自動的にフォーマット修正を実行
- Gitmoji と Conventional Commits をサポート
- レート制限やクォータ超過時の自動フォールバック
- 多言語のコミットメッセージ出力
- Git diff 最適化：ステージ済みの変更をバッチ分析し、ファイルごとの逐次 diff 待ち時間を削減
- ステータスバー、SCM ボタン、コマンドパレット、ショートカットから利用可能

## インストール

### `.vsix` からインストール

1. VS Code で `Extensions: Install from VSIX...` を実行
2. `.vsix` ファイルを選択

### ソースからビルド

```bash
git clone https://github.com/gif156359098/ai-commit-lite.git
cd ai-commit-lite
npm install
npm run compile
npm run package
```

## 使い方チュートリアル

### 1. Profile Manager を開く

次のいずれかを使います。

- ステータスバーの `AI Commit Lite`
- コマンドパレットの `AI Commit Lite: Open Profile Manager`

初回インストールで Profile がまだない場合は、オンボーディング通知が表示されます。

### 2. Profile を追加する

1. `Add Profile` をクリック
2. プロバイダーを選択
3. 表示名を入力
4. モデル名を入力
5. API キーを入力
6. `Azure OpenAI` または `OpenAI-Compatible` の場合は Endpoint / Base URL も入力
7. 保存

補足:

- 編集時に API キーを空欄にすると既存のキーを保持します
- 最初に作成した Profile は自動でアクティブになります

### 3. 変更をステージする

```bash
git add .
```

### 4. コミットメッセージを生成する

利用できる入口:

- `AI Commit Lite: Generate Commit`
- SCM タイトルボタン
- `Ctrl+Shift+G Ctrl+Shift+C`
- macOS: `Cmd+Shift+G Cmd+Shift+C`

生成されたメッセージは Source Control の入力欄に自動で入ります。

### 5. コミットスタイルを選ぶ

`aiCommitLite.commitMessageStyle` を設定します。

- `detailed`: 1 行の件名 + 2 から 5 個の箇条書き
- `concise`: 1 行の件名のみ

モデルが詳細形式に従わない場合、拡張が 1 回だけ自動修正を試みます。

## 対応プロバイダー

| プロバイダー | 用途 | カスタム Endpoint |
| --- | --- | --- |
| OpenAI | OpenAI 公式モデル | 不要 |
| Azure OpenAI | Azure 上の OpenAI モデル | 必要 |
| DeepSeek | DeepSeek 公式モデル | 不要 |
| Gemini | Google Gemini 公式モデル | 不要 |
| Anthropic | Claude 公式モデル | 不要 |
| Cohere | Cohere / Command 公式モデル | 不要 |
| Mistral | Mistral 公式モデル | 不要 |
| Qwen / DashScope | Alibaba Cloud DashScope モデル | 不要 |
| OpenAI-Compatible | OpenRouter、互換ゲートウェイ、自前ホスト互換 API など | 必要 |

## 主な設定

| 設定 | 既定値 | 説明 |
| --- | --- | --- |
| `aiCommitLite.language` | `en` | 出力言語 |
| `aiCommitLite.useGitmoji` | `true` | Gitmoji を使うか |
| `aiCommitLite.conventionalCommits` | `true` | Conventional Commits を使うか |
| `aiCommitLite.commitMessageStyle` | `detailed` | 出力スタイル |
| `aiCommitLite.customSystemPrompt` | `""` | カスタムシステムプロンプト |
| `aiCommitLite.temperature` | `0.7` | 生成温度 |
| `aiCommitLite.maxTokens` | `1000` | 最大出力トークン数 |
| `aiCommitLite.maxDiffCharacters` | `24000` | diff 全体の上限 |
| `aiCommitLite.maxFileDiffCharacters` | `8000` | 1 ファイルあたりの上限 |
| `aiCommitLite.contextExcludePatterns` | 内蔵デフォルト値 | diff 分析から除外するファイルパターン |
| `aiCommitLite.enableAutoFallback` | `true` | 自動フォールバック |
| `aiCommitLite.profileFallbackOrder` | `[]` | フォールバック順序 |
| `aiCommitLite.profiles` | `[]` | 保存されたプロファイルメタデータ |
| `aiCommitLite.activeProfile` | `""` | アクティブプロファイルID |

## コマンド

- `AI Commit Lite: Generate Commit`
- `AI Commit Lite: Switch Profile`
- `AI Commit Lite: Add Profile`
- `AI Commit Lite: Edit Profile`
- `AI Commit Lite: Delete Profile`
- `AI Commit Lite: Open Profile Manager`

## トラブルシューティング

### Profile が見つからない

- `AI Commit Lite: Open Profile Manager` を実行
- 少なくとも 1 つ Profile があるか確認

### ステージ済み変更がないと表示される

先に `git add` を実行してください。

### 生成が遅い

- 大きな生成物やバイナリをステージしすぎない
- `aiCommitLite.contextExcludePatterns` を調整
- `aiCommitLite.maxDiffCharacters` を下げる

### クォータやレート制限に当たる

`aiCommitLite.enableAutoFallback` を有効にし、`aiCommitLite.profileFallbackOrder` を設定してください。

### 推論モデルの出力フォーマットが不安定

- `aiCommitLite.commitMessageStyle = detailed` を維持
- 必要に応じて `aiCommitLite.maxTokens` を増やす
- 一部の推論モデルが依然として 1 行のみ返す場合、拡張機能が自動的にフォーマット修正を実行

## 開発

#### 必要環境

- Node.js 18+
- VS Code 1.80+

#### コマンド

```bash
npm run compile
npm run watch
npm run lint
npm test
npm run package
```

注意: リポジトリには `npm test` が含まれており、先にテスト対象をコンパイルしてから Node ネイティブテストを実行します。

## License

[MIT](LICENSE)


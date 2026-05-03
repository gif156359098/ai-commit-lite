# AI Commit Lite

AI を使って Git コミットメッセージを自動生成する VS Code 拡張機能です。

[**简体中文 / English バイリンガル版 →**](README.md)

---

## クイックスタート

3ステップで使い始められます：

**1️⃣ 拡張機能をインストール**
Profile が存在しない場合、インストール後にウェルカム通知が表示されます。

**2️⃣ AI を設定**
「Profile を追加」→「プロバイダーを選択」→「API Key を入力」
（Key は VS Code Secret Storage に安全に保存されます）

**3️⃣ コミットを生成**
```bash
git add .
```
任意の方法で生成：
- コマンドパレット：`AI Commit Lite: Generate Commit`
- SCM タイトルボタン
- `Ctrl+Shift+G Ctrl+Shift+C`

生成後、メッセージは Source Control の入力欄に自動入力されます。

## 機能プレビュー

![Profile 管理](docs/images/01.png)
![コミット生成](docs/images/02.png)

## できること

**Q: どのプロバイダーをサポート？**
OpenAI、DeepSeek、Gemini、Anthropic、Cohere、Mistral、DashScope、OpenAI 互換 API など。

**Q: API キーは安全？**
はい。キーは VS Code Secret Storage に保存され、平文で設定に書き込まれることはありません。

**Q: 複数の AI 設定可以使用？**
はい。Profile Manager で複数の設定を作成し、異なるチームやアカウントのアカウントを管理できます。自動フォールバック順序も設定可能。

**Q: 出力フォーマットは調整可能？**
`detailed`（詳細版、要点リスト付き）と `concise`（簡潔版、1行のみ）の2種類をサポート。

**Q: 多言語出力？**
対応言語：英語、简体中文、日本語、韓国語、スペイン語、フランス語、ドイツ語、ロシア語、ポルトガル語、イタリア語（10言語）。

## 対応プロバイダー

| プロバイダー | 説明 |
| --- | --- |
| OpenAI | OpenAI 公式モデル |
| DeepSeek | DeepSeek 公式モデル |
| Gemini | Google Gemini |
| Anthropic | Anthropic Claude シリーズ |
| Cohere | Command シリーズ |
| Mistral | Mistral 公式モデル |
| DashScope | Alibaba Cloud 通義千問 |
| Azure OpenAI | Azure 上の OpenAI |
| OpenAI-Compatible | OpenRouter、自/self-Hosted サービスなど |

*カスタム Endpoint が必要：Azure OpenAI、OpenAI-Compatible*

## コマンド

| コマンド | 説明 |
| --- | --- |
| `AI Commit Lite: Generate Commit` | コミットメッセージを生成 |
| `AI Commit Lite: Open Profile Manager` | 設定画面を開く |
| `AI Commit Lite: Switch Profile` | Profile を切り替え |
| `AI Commit Lite: Add Profile` | 新規 Profile 追加 |
| `AI Commit Lite: Edit Profile` | Profile を編集 |
| `AI Commit Lite: Delete Profile` | Profile を削除 |

**ショートカット**: `Ctrl+Shift+G Ctrl+Shift+C` (Windows/Linux), `Cmd+Shift+G Cmd+Shift+C` (macOS)

## 設定

| 設定 | デフォルト | 説明 |
| --- | --- | --- |
| `aiCommitLite.language` | `en` | 出力言語 |
| `aiCommitLite.useGitmoji` | `true` | Gitmoji を使用するか |
| `aiCommitLite.commitMessageStyle` | `detailed` | `detailed` または `concise` |
| `aiCommitLite.enableAutoFallback` | `true` | 自動フォールバックを有効化 |
| `aiCommitLite.profileFallbackOrder` | `[]` | フォールバック優先順位 |
| `aiCommitLite.maxDiffCharacters` | `24000` | 全 diff 文字数の上限 |
| `aiCommitLite.maxFileDiffCharacters` | `8000` | ファイルあたりの上限 |

## よくある問題

**Profile が見つからない？**
- ステータスバーの「AI Commit Lite」をクリック
- または `AI Commit Lite: Open Profile Manager` を実行

**ステージ済み変更がないと言われる？**
先に `git add .` を実行してください。

**生成が遅い？**
- 不要な大きなファイルやバイナリをステージングしない
- `aiCommitLite.contextExcludePatterns` を調整

**レートリミットやクォータに達した？**
1. `aiCommitLite.enableAutoFallback` を有効化
2. Profile Manager でフォールバック優先度を設定

**推理モデルの出力が不安定？**
`aiCommitLite.commitMessageStyle = detailed` を維持してください。拡張が自動的にフォーマットを修正します。

---

## 開発者向け

**要件**: Node.js 18+ / VS Code 1.80+

**コマンド**:
```bash
npm run compile   # コンパイル
npm run watch    # 監視モード
npm run lint      # リント
npm test          # テスト
npm run package   # パッケージ
```

## License

[MIT](LICENSE)
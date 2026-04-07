# AI Commit Lite

Consulte a versão bilíngue em chinês e inglês em [README.md](README.md).

AI Commit Lite é uma extensão do VS Code que usa IA para gerar mensagens de commit a partir das alterações Git já colocadas em staging. A versão atual não usa mais o fluxo antigo com uma única configuração de provedor; agora ela utiliza um fluxo baseado em `Profile Manager` para administrar vários provedores e modelos.

## Recursos

- `Profile Manager` visual
- Suporte para OpenAI, Azure OpenAI, DeepSeek, Gemini, Anthropic, Cohere, Mistral, Qwen / DashScope e serviços OpenAI-Compatible
- Armazenamento seguro das chaves de API com VS Code Secret Storage
- Dois estilos de commit: `detailed` e `concise`
- Correção automática de formato: se um modelo não seguir o formato detalhado exigido, a extensão executa uma correção automática
- Suporte a Gitmoji e Conventional Commits
- Fallback automático para perfis de backup
- Saída multilíngue para mensagens de commit
- Otimização do Git diff: análise em lote das alterações em staging, reduzindo o tempo de espera do diff sequencial por arquivo
- Acesso pela barra de status, botão do SCM, paleta de comandos e atalho de teclado

## Instalação

### Instalar um `.vsix`

1. Execute `Extensions: Install from VSIX...` no VS Code
2. Selecione o arquivo `.vsix`

### Compilar a partir do código-fonte

```bash
git clone https://github.com/gif156359098/ai-commit-lite.git
cd ai-commit-lite
npm install
npm run compile
npm run package
```

## Tutorial de uso

### 1. Abrir o Profile Manager

Você pode abri-lo a partir de:

- `AI Commit Lite` na barra de status
- `AI Commit Lite: Open Profile Manager` na paleta de comandos

Se a extensão for instalada pela primeira vez e ainda não existir nenhum perfil, um aviso de onboarding será exibido automaticamente.

### 2. Criar um perfil

1. Clique em `Add Profile`
2. Escolha o provedor
3. Informe o nome de exibição
4. Informe o modelo
5. Informe a chave de API
6. Se escolher `Azure OpenAI` ou `OpenAI-Compatible`, informe também o Endpoint / Base URL
7. Salve

Observações:

- Ao editar um perfil, deixar o campo da API key vazio mantém a chave existente
- O primeiro perfil criado se torna automaticamente o perfil ativo

### 3. Colocar as alterações em staging

```bash
git add .
```

### 4. Gerar a mensagem de commit

Entradas disponíveis:

- `AI Commit Lite: Generate Commit`
- Botão do título do SCM
- `Ctrl+Shift+G Ctrl+Shift+C`
- macOS: `Cmd+Shift+G Cmd+Shift+C`

A mensagem gerada é inserida automaticamente na caixa de entrada do Source Control.

### 5. Escolher o estilo do commit

Configure `aiCommitLite.commitMessageStyle`:

- `detailed`: uma linha de assunto + 2 a 5 tópicos
- `concise`: apenas uma linha de assunto

Se o modelo não seguir o formato detalhado, a extensão tenta uma correção automática uma vez.

## Provedores compatíveis

| Provedor | Uso típico | Endpoint personalizado |
| --- | --- | --- |
| OpenAI | Modelos oficiais da OpenAI | Não |
| Azure OpenAI | Modelos da OpenAI implantados no Azure | Sim |
| DeepSeek | Modelos oficiais da DeepSeek | Não |
| Gemini | Modelos oficiais do Google Gemini | Não |
| Anthropic | Modelos oficiais Claude | Não |
| Cohere | Modelos oficiais Cohere / Command | Não |
| Mistral | Modelos oficiais Mistral | Não |
| Qwen / DashScope | Modelos do Alibaba Cloud DashScope | Não |
| OpenAI-Compatible | OpenRouter, gateways compatíveis, serviços compatíveis auto-hospedados e afins | Sim |

## Configurações importantes

| Configuração | Padrão | Descrição |
| --- | --- | --- |
| `aiCommitLite.language` | `en` | Idioma de saída |
| `aiCommitLite.useGitmoji` | `true` | Usar Gitmoji |
| `aiCommitLite.conventionalCommits` | `true` | Usar Conventional Commits |
| `aiCommitLite.commitMessageStyle` | `detailed` | Estilo de saída |
| `aiCommitLite.customSystemPrompt` | `""` | Prompt de sistema personalizado |
| `aiCommitLite.temperature` | `0.7` | Temperatura do modelo |
| `aiCommitLite.maxTokens` | `1000` | Máximo de tokens de saída |
| `aiCommitLite.maxDiffCharacters` | `24000` | Limite total de diff |
| `aiCommitLite.maxFileDiffCharacters` | `8000` | Limite por arquivo |
| `aiCommitLite.contextExcludePatterns` | valores padrão integrados | Padrões excluídos da análise de diff |
| `aiCommitLite.enableAutoFallback` | `true` | Ativar fallback automático |
| `aiCommitLite.profileFallbackOrder` | `[]` | Ordem de fallback |
| `aiCommitLite.profiles` | `[]` | Metadados dos perfis armazenados |
| `aiCommitLite.activeProfile` | `""` | ID do perfil ativo |

## Comandos

- `AI Commit Lite: Generate Commit`
- `AI Commit Lite: Switch Profile`
- `AI Commit Lite: Add Profile`
- `AI Commit Lite: Edit Profile`
- `AI Commit Lite: Delete Profile`
- `AI Commit Lite: Open Profile Manager`

## Solução de problemas

### Não vejo meus perfis

- Execute `AI Commit Lite: Open Profile Manager`
- Verifique se pelo menos um perfil foi criado

### Não há alterações em staging

Execute `git add` primeiro.

### A geração está lenta

- Evite colocar arquivos binários ou muito grandes em staging sem necessidade
- Ajuste `aiCommitLite.contextExcludePatterns`
- Reduza `aiCommitLite.maxDiffCharacters`

### Problemas de cota ou rate limit

Ative `aiCommitLite.enableAutoFallback` e configure `aiCommitLite.profileFallbackOrder`.

### Modelos de raciocínio retornam formato inconsistente

- Mantenha `aiCommitLite.commitMessageStyle = detailed`
- Aumente `aiCommitLite.maxTokens` quando necessário
- Se alguns modelos de raciocínio continuarem retornando apenas uma linha, a extensão executará automaticamente uma correção de formato

## Desenvolvimento

#### Requisitos

- Node.js 18+
- VS Code 1.80+

#### Comandos

```bash
npm run compile
npm run watch
npm run lint
npm test
npm run package
```

Nota: o repositório inclui `npm test`, que primeiro compila os alvos de teste e depois executa os testes nativos do Node.

## License

[MIT](LICENSE)


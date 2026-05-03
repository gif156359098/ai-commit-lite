# AI Commit Lite

Extensão do VS Code que usa IA para gerar automaticamente mensagens de commit Git.

[**简体中文 / English 主文档 →**](README.md)

---

## Início Rápido

3 passos para começar:

**1️⃣ Instalar a extensão**
Se não existir nenhum Profile, uma notificação de boas-vindas aparecerá após a instalação.

**2️⃣ Configurar IA**
「Add Profile」→「Selecionar fornecedor」→「Inserir API Key」
(A chave é armazenada de forma segura no VS Code Secret Storage)

**3️⃣ Gerar commit**
```bash
git add .
```
Gerar com qualquer um destes métodos:
- Paleta de comandos: `AI Commit Lite: Generate Commit`
- Botão do título SCM
- `Ctrl+Shift+G Ctrl+Shift+C`

A mensagem gerada será inserida automaticamente no campo Source Control.

## Prévia

![Gestão de Profile](docs/images/01.png)
![Geração de commit](docs/images/02.png)

## O que pode fazer

**Q: Quais provedores são suportados?**
OpenAI, DeepSeek, Gemini, Anthropic, Cohere, Mistral, DashScope e APIs compatíveis com OpenAI.

**Q: As chaves API são seguras?**
Sim. As chaves são armazenadas no VS Code Secret Storage e não aparecem em texto simples nas configurações.

**Q: Posso usar múltiplas configurações de IA?**
Sim. O Profile Manager permite criar múltiplas configurações para diferentes equipes ou contas. O fallback automático também é configurável.

**Q: Posso ajustar o formato de saída?**
Suporta `detailed` (detalhado, com tópicos) e `concise` (conciso, uma única linha).

**Q: Saída multilíngue?**
Idiomas suportados: inglês, chinês simplificado, japonês, coreano, espanhol, francês, alemão, russo, português, italiano (10 idiomas).

## Provedores Suportados

| Provedor | Descrição |
| --- | --- |
| OpenAI | Modelos oficiais da OpenAI |
| DeepSeek | Modelos oficiais da DeepSeek |
| Gemini | Google Gemini |
| Anthropic | Série Claude da Anthropic |
| Cohere | Série Command |
| Mistral | Modelos oficiais da Mistral |
| DashScope | Tongyi Qianwen da Alibaba Cloud |
| Azure OpenAI | OpenAI no Azure |
| OpenAI-Compatible | OpenRouter, serviços auto-hospedados, etc. |

*Endpoint personalizado necessário: Azure OpenAI, OpenAI-Compatible*

## Comandos

| Comando | Descrição |
| --- | --- |
| `AI Commit Lite: Generate Commit` | Gerar mensagem de commit |
| `AI Commit Lite: Open Profile Manager` | Abrir configurações |
| `AI Commit Lite: Switch Profile` | Trocar Profile |
| `AI Commit Lite: Add Profile` | Adicionar novo Profile |
| `AI Commit Lite: Edit Profile` | Editar Profile |
| `AI Commit Lite: Delete Profile` | Excluir Profile |

**Atalho**: `Ctrl+Shift+G Ctrl+Shift+C` (Windows/Linux), `Cmd+Shift+G Cmd+Shift+C` (macOS)

## Configurações

| Configuração | Valor padrão | Descrição |
| --- | --- | --- |
| `aiCommitLite.language` | `en` | Idioma de saída |
| `aiCommitLite.useGitmoji` | `true` | Usar Gitmoji |
| `aiCommitLite.commitMessageStyle` | `detailed` | `detailed` ou `concise` |
| `aiCommitLite.enableAutoFallback` | `true` | Ativar fallback automático |
| `aiCommitLite.profileFallbackOrder` | `[]` | Prioridade de fallback |
| `aiCommitLite.maxDiffCharacters` | `24000` | Limite total de caracteres diff |
| `aiCommitLite.maxFileDiffCharacters` | `8000` | Limite por arquivo |

## Solução de Problemas

**Profile não visível?**
- Clique em "AI Commit Lite" na barra de status
- Ou execute `AI Commit Lite: Open Profile Manager`

**Nenhuma alteração em stage?**
Primeiro execute `git add .`.

**Geração lenta?**
- Evite fazer stage de arquivos grandes ou binários desnecessários
- Ajuste `aiCommitLite.contextExcludePatterns`

**Limite de taxa ou cota atingida?**
1. Ative `aiCommitLite.enableAutoFallback`
2. Configure a prioridade de fallback no Profile Manager

**Formatação inconsistente dos modelos de raciocínio?**
Mantenha `aiCommitLite.commitMessageStyle = detailed`. A extensão corrigirá o formato automaticamente.

---

## Para Desenvolvedores

**Requisitos**: Node.js 18+ / VS Code 1.80+

**Comandos**:
```bash
npm run compile   # Compilar
npm run watch    # Modo de observação
npm run lint      # Linting
npm test          # Testes
npm run package   # Empacotar
```

## License

[MIT](LICENSE)
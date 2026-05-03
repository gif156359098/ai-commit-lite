# AI Commit Lite

Estensione VS Code che utilizza l'IA per generare automaticamente messaggi di commit Git.

[**简体中文 / English 主文档 →**](README.md)

---

## Avvio Rapido

3 passaggi per iniziare:

**1️⃣ Installare l'estensione**
Se non esiste alcun Profile, after l'installazione apparirà una notifica di benvenuto.

**2️⃣ Configurare l'IA**
「Add Profile」→「Seleziona provider」→「Inserisci API Key」
(La chiave viene archiviata in modo sicuro in VS Code Secret Storage)

**3️⃣ Generare il commit**
```bash
git add .
```
Genera con uno di questi metodi:
- Palette comandi: `AI Commit Lite: Generate Commit`
- Pulsante titolo SCM
- `Ctrl+Shift+G Ctrl+Shift+C`

Il messaggio generato verrà inserito automaticamente nel campo Source Control.

## Anteprima

![Gestione Profile](docs/images/01.png)
![Generazione commit](docs/images/02.png)

## Cosa può fare

**Q: Quali provider sono supportati?**
OpenAI, DeepSeek, Gemini, Anthropic, Cohere, Mistral, DashScope e API compatibili con OpenAI.

**Q: Le chiavi API sono sicure?**
Sì. Le chiavi vengono archiviate in VS Code Secret Storage e non appaiono in testo normale nelle impostazioni.

**Q: Posso usare più configurazioni AI?**
Sì. Profile Manager consente di creare multiple configurazioni per diversi team o account. Il fallback automatico è configurabile.

**Q: Posso regolare il formato di output?**
Supporta `detailed` (dettagliato, con elenchi puntati) e `concise` (conciso, una sola riga).

**Q: Output multilingua?**
Lingue supportate: inglese, cinese semplificato, giapponese, coreano, spagnolo, francese, tedesco, russo, portoghese, italiano (10 lingue).

## Provider Supportati

| Provider | Descrizione |
| --- | --- |
| OpenAI | Modelli ufficiali OpenAI |
| DeepSeek | Modelli ufficiali DeepSeek |
| Gemini | Google Gemini |
| Anthropic | Serie Claude di Anthropic |
| Cohere | Serie Command |
| Mistral | Modelli ufficiali Mistral |
| DashScope | Tongyi Qianwen di Alibaba Cloud |
| Azure OpenAI | OpenAI su Azure |
| OpenAI-Compatible | OpenRouter, servizi auto-ospitati, ecc. |

*Endpoint personalizzato richiesto: Azure OpenAI, OpenAI-Compatible*

## Comandi

| Comando | Descrizione |
| --- | --- |
| `AI Commit Lite: Generate Commit` | Genera messaggio di commit |
| `AI Commit Lite: Open Profile Manager` | Apri impostazioni |
| `AI Commit Lite: Switch Profile` | Cambia Profile |
| `AI Commit Lite: Add Profile` | Aggiungi nuovo Profile |
| `AI Commit Lite: Edit Profile` | Modifica Profile |
| `AI Commit Lite: Delete Profile` | Elimina Profile |

**Scorciatoia**: `Ctrl+Shift+G Ctrl+Shift+C` (Windows/Linux), `Cmd+Shift+G Cmd+Shift+C` (macOS)

## Impostazioni

| Impostazione | Valore predefinito | Descrizione |
| --- | --- | --- |
| `aiCommitLite.language` | `en` | Lingua di output |
| `aiCommitLite.useGitmoji` | `true` | Usa Gitmoji |
| `aiCommitLite.commitMessageStyle` | `detailed` | `detailed` o `concise` |
| `aiCommitLite.enableAutoFallback` | `true` | Attiva fallback automatico |
| `aiCommitLite.profileFallbackOrder` | `[]` | Priorità fallback |
| `aiCommitLite.maxDiffCharacters` | `24000` | Limite totale caratteri diff |
| `aiCommitLite.maxFileDiffCharacters` | `8000` | Limite per file |

## Risoluzione Problemi

**Profile non visibile?**
- Fai clic su "AI Commit Lite" nella barra di stato
- Oppure esegui `AI Commit Lite: Open Profile Manager`

**Nessuna modifica stagiata?**
Esegui prima `git add .`.

**Generazione lenta?**
- Evita di stage file grandi o binari non necessari
- Regola `aiCommitLite.contextExcludePatterns`

**Limite di frequenza o quota raggiunta?**
1. Attiva `aiCommitLite.enableAutoFallback`
2. Configura la priorità di fallback in Profile Manager

**Formattazione incoerente dei modelli di ragionamento?**
Mantieni `aiCommitLite.commitMessageStyle = detailed`. L'estensione correggerà automaticamente il formato.

---

## Per Sviluppatori

**Requisiti**: Node.js 18+ / VS Code 1.80+

**Comandi**:
```bash
npm run compile   # Compila
npm run watch     # Modalità sorveglianza
npm run lint      # Linting
npm test          # Test
npm run package   # Pacchetto
```

## License

[MIT](LICENSE)
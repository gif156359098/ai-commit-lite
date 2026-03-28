# AI Commit Lite

Per la versione bilingue cinese-inglese, consulta [README.md](README.md).

AI Commit Lite è un'estensione per VS Code che usa l'IA per generare messaggi di commit a partire dalle modifiche Git già in staging. La versione attuale non usa più il vecchio flusso con una singola configurazione del provider; ora utilizza un flusso basato su `Profile Manager` per gestire più provider e più modelli.

## Funzionalità

- `Profile Manager` visuale
- Supporto per OpenAI, Azure OpenAI, DeepSeek, Gemini, Anthropic, Cohere, Mistral, Qwen / DashScope e servizi OpenAI-Compatible
- Archiviazione sicura delle API key tramite VS Code Secret Storage
- Due stili di commit: `detailed` e `concise`
- Correzione automatica del formato: se un modello non rispetta il formato dettagliato richiesto, l'estensione esegue automaticamente una correzione
- Supporto per Gitmoji e Conventional Commits
- Fallback automatico verso profili di backup
- Output dei commit in più lingue
- Ottimizzazione del Git diff: analisi in batch delle modifiche in staging, riducendo i tempi di attesa del diff sequenziale per file
- Accesso da barra di stato, pulsante SCM, Command Palette e scorciatoia da tastiera

## Installazione

### Installare un file `.vsix`

1. Esegui `Extensions: Install from VSIX...` in VS Code
2. Seleziona il file `.vsix`

### Compilare dal codice sorgente

```bash
git clone https://github.com/gif156359098/ai-commit-lite.git
cd ai-commit-lite
npm install
npm run compile
npm run package
```

## Tutorial d'uso

### 1. Aprire Profile Manager

Puoi aprirlo da:

- `AI Commit Lite` nella barra di stato
- `AI Commit Lite: Open Profile Manager` nella Command Palette

Se installi l'estensione per la prima volta e non esiste ancora alcun profilo, viene mostrato automaticamente un messaggio di onboarding.

### 2. Creare un profilo

1. Fai clic su `Add Profile`
2. Scegli il provider
3. Inserisci il nome visualizzato
4. Inserisci il modello
5. Inserisci l'API key
6. Se scegli `Azure OpenAI` o `OpenAI-Compatible`, inserisci anche Endpoint / Base URL
7. Salva

Note:

- Se durante la modifica lasci vuoto il campo API key, la chiave esistente viene mantenuta
- Il primo profilo creato diventa automaticamente il profilo attivo

### 3. Mettere le modifiche in staging

```bash
git add .
```

### 4. Generare il messaggio di commit

Punti di accesso disponibili:

- `AI Commit Lite: Generate Commit`
- Pulsante nel titolo SCM
- `Ctrl+Shift+G Ctrl+Shift+C`
- macOS: `Cmd+Shift+G Cmd+Shift+C`

Il messaggio generato viene inserito automaticamente nella casella di input di Source Control.

### 5. Scegliere lo stile del commit

Configura `aiCommitLite.commitMessageStyle`:

- `detailed`: una riga di titolo + 2-5 punti elenco
- `concise`: solo una riga di titolo

Se il modello non rispetta il formato dettagliato, l'estensione prova una correzione automatica una sola volta.

## Provider supportati

| Provider | Uso tipico | Endpoint personalizzato |
| --- | --- | --- |
| OpenAI | Modelli ufficiali OpenAI | No |
| Azure OpenAI | Modelli OpenAI distribuiti in Azure | Sì |
| DeepSeek | Modelli ufficiali DeepSeek | No |
| Gemini | Modelli ufficiali Google Gemini | No |
| Anthropic | Modelli ufficiali Claude | No |
| Cohere | Modelli ufficiali Cohere / Command | No |
| Mistral | Modelli ufficiali Mistral | No |
| Qwen / DashScope | Modelli di Alibaba Cloud DashScope | No |
| OpenAI-Compatible | OpenRouter, gateway compatibili, servizi self-hosted compatibili e simili | Sì |

## Impostazioni importanti

| Impostazione | Valore predefinito | Descrizione |
| --- | --- | --- |
| `aiCommitLite.language` | `en` | Lingua di output |
| `aiCommitLite.useGitmoji` | `true` | Usare Gitmoji |
| `aiCommitLite.conventionalCommits` | `true` | Usare Conventional Commits |
| `aiCommitLite.commitMessageStyle` | `detailed` | Stile di output |
| `aiCommitLite.customSystemPrompt` | `""` | Prompt di sistema personalizzato |
| `aiCommitLite.temperature` | `0.7` | Temperatura del modello |
| `aiCommitLite.maxTokens` | `1000` | Token massimi in uscita |
| `aiCommitLite.maxDiffCharacters` | `24000` | Limite totale del diff |
| `aiCommitLite.maxFileDiffCharacters` | `8000` | Limite per file |
| `aiCommitLite.contextExcludePatterns` | valori predefiniti integrati | Modelli esclusi dall'analisi del diff |
| `aiCommitLite.enableAutoFallback` | `true` | Abilitare il fallback automatico |
| `aiCommitLite.profileFallbackOrder` | `[]` | Ordine di fallback |
| `aiCommitLite.profiles` | `[]` | Metadati dei profili memorizzati |
| `aiCommitLite.activeProfile` | `""` | ID del profilo attivo |

## Comandi

- `AI Commit Lite: Generate Commit`
- `AI Commit Lite: Switch Profile`
- `AI Commit Lite: Add Profile`
- `AI Commit Lite: Edit Profile`
- `AI Commit Lite: Delete Profile`
- `AI Commit Lite: Open Profile Manager`

## Risoluzione dei problemi

### Non vedo i miei profili

- Esegui `AI Commit Lite: Open Profile Manager`
- Verifica di aver creato almeno un profilo

### Nessuna modifica in staging

Esegui prima `git add`.

### La generazione è lenta

- Evita di mettere in staging file binari o molto grandi se non necessario
- Regola `aiCommitLite.contextExcludePatterns`
- Riduci `aiCommitLite.maxDiffCharacters`

### Problemi di quota o rate limit

Attiva `aiCommitLite.enableAutoFallback` e configura `aiCommitLite.profileFallbackOrder`.

### I modelli di ragionamento restituiscono un formato incoerente

- Mantieni `aiCommitLite.commitMessageStyle = detailed`
- Aumenta `aiCommitLite.maxTokens` quando necessario
- Se alcuni modelli di ragionamento continuano a restituire solo una riga, l'estensione eseguirà automaticamente una correzione del formato

## Sviluppo

#### Requisiti

- Node.js 18+
- VS Code 1.80+

#### Comandi

```bash
npm run compile
npm run watch
npm run lint
npm run package
```

Nota: il repository non include attualmente uno script di test integrato.

## License

[MIT](LICENSE)


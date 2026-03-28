# AI Commit Lite

Die standardmäßige zweisprachige Dokumentation auf Chinesisch und Englisch findest du in [README.md](README.md).

AI Commit Lite ist eine VS Code-Erweiterung, die mit KI Commit-Nachrichten aus den aktuell gestagten Git-Änderungen erzeugt. Die aktuelle Version verwendet nicht mehr den alten Einzel-Workflow mit einer einzigen Anbieter-Konfiguration, sondern einen profilbasierten Ablauf über den `Profile Manager`.

## Funktionen

- Visueller `Profile Manager`
- Unterstützung für OpenAI, Azure OpenAI, DeepSeek, Gemini, Anthropic, Cohere, Mistral, Qwen / DashScope und OpenAI-Compatible-Dienste
- Sichere Speicherung der API-Schlüssel über VS Code Secret Storage
- Zwei Commit-Stile: `detailed` und `concise`
- Automatische Formatkorrektur: Wenn ein Modell das erforderliche detaillierte Format nicht einhält, führt die Erweiterung automatisch eine Formatkorrektur durch
- Unterstützung für Gitmoji und Conventional Commits
- Automatischer Wechsel zu Backup-Profilen
- Mehrsprachige Commit-Ausgabe
- Git-Diff-Optimierung: Staged Changes werden gebatcht analysiert, um Wartezeiten durch sequenzielle Datei-Diffs zu reduzieren
- Zugriff über Statusleiste, SCM-Schaltfläche, Befehlspalette und Tastenkürzel

## Installation

### `.vsix` installieren

1. Führe in VS Code `Extensions: Install from VSIX...` aus
2. Wähle die `.vsix`-Datei aus

### Aus dem Quellcode bauen

```bash
git clone https://github.com/gif156359098/ai-commit-lite.git
cd ai-commit-lite
npm install
npm run compile
npm run package
```

## Anleitung

### 1. Profile Manager öffnen

Du kannst ihn hier öffnen:

- über `AI Commit Lite` in der Statusleiste
- über `AI Commit Lite: Open Profile Manager` in der Befehlspalette

Wenn nach der Installation noch kein Profil vorhanden ist, zeigt die Erweiterung automatisch einen Onboarding-Hinweis an.

### 2. Ein Profil anlegen

1. Klicke auf `Add Profile`
2. Wähle den Anbieter
3. Gib einen Anzeigenamen ein
4. Gib den Modellnamen ein
5. Gib den API-Schlüssel ein
6. Bei `Azure OpenAI` oder `OpenAI-Compatible` zusätzlich Endpoint / Base URL eintragen
7. Speichern

Hinweise:

- Wenn das Feld für den API-Schlüssel beim Bearbeiten leer bleibt, wird der vorhandene Schlüssel beibehalten
- Das erste Profil wird automatisch als aktives Profil gesetzt

### 3. Änderungen stagen

```bash
git add .
```

### 4. Commit-Nachricht erzeugen

Verfügbare Einstiege:

- `AI Commit Lite: Generate Commit`
- SCM-Titel-Schaltfläche
- `Ctrl+Shift+G Ctrl+Shift+C`
- macOS: `Cmd+Shift+G Cmd+Shift+C`

Die erzeugte Commit-Nachricht wird automatisch in das Source-Control-Eingabefeld eingefügt.

### 5. Commit-Stil wählen

Setze `aiCommitLite.commitMessageStyle`:

- `detailed`: eine Betreffzeile + 2 bis 5 Stichpunkte
- `concise`: nur eine Betreffzeile

Wenn ein Modell das detaillierte Format nicht einhält, versucht die Erweiterung einmal automatisch eine Formatkorrektur.

## Unterstützte Anbieter

| Anbieter | Typischer Einsatz | Eigener Endpoint erforderlich |
| --- | --- | --- |
| OpenAI | Offizielle OpenAI-Modelle | Nein |
| Azure OpenAI | In Azure bereitgestellte OpenAI-Modelle | Ja |
| DeepSeek | Offizielle DeepSeek-Modelle | Nein |
| Gemini | Offizielle Google-Gemini-Modelle | Nein |
| Anthropic | Offizielle Claude-Modelle | Nein |
| Cohere | Offizielle Cohere-/Command-Modelle | Nein |
| Mistral | Offizielle Mistral-Modelle | Nein |
| Qwen / DashScope | Alibaba Cloud DashScope-Modelle | Nein |
| OpenAI-Compatible | OpenRouter, kompatible Gateways, selbst gehostete kompatible APIs usw. | Ja |

## Wichtige Einstellungen

| Einstellung | Standardwert | Beschreibung |
| --- | --- | --- |
| `aiCommitLite.language` | `en` | Ausgabesprache |
| `aiCommitLite.useGitmoji` | `true` | Gitmoji verwenden |
| `aiCommitLite.conventionalCommits` | `true` | Conventional Commits verwenden |
| `aiCommitLite.commitMessageStyle` | `detailed` | Ausgabestil |
| `aiCommitLite.customSystemPrompt` | `""` | Benutzerdefinierter System-Prompt |
| `aiCommitLite.temperature` | `0.7` | Modelltemperatur |
| `aiCommitLite.maxTokens` | `1000` | Maximale Ausgabetokens |
| `aiCommitLite.maxDiffCharacters` | `24000` | Gesamtes Diff-Limit |
| `aiCommitLite.maxFileDiffCharacters` | `8000` | Diff-Limit pro Datei |
| `aiCommitLite.contextExcludePatterns` | integrierte Standardwerte | Muster, die von der Diff-Analyse ausgeschlossen werden |
| `aiCommitLite.enableAutoFallback` | `true` | Automatischen Fallback aktivieren |
| `aiCommitLite.profileFallbackOrder` | `[]` | Reihenfolge für Fallback |
| `aiCommitLite.profiles` | `[]` | Gespeicherte Profilmetadaten |
| `aiCommitLite.activeProfile` | `""` | Aktive Profil-ID |

## Befehle

- `AI Commit Lite: Generate Commit`
- `AI Commit Lite: Switch Profile`
- `AI Commit Lite: Add Profile`
- `AI Commit Lite: Edit Profile`
- `AI Commit Lite: Delete Profile`
- `AI Commit Lite: Open Profile Manager`

## Fehlerbehebung

### Keine Profile sichtbar

- Führe `AI Commit Lite: Open Profile Manager` aus
- Prüfe, ob mindestens ein Profil angelegt wurde

### Keine gestagten Änderungen

Führe zuerst `git add` aus.

### Generierung ist langsam

- Große generierte Dateien oder Binärdateien nur bei Bedarf stagen
- `aiCommitLite.contextExcludePatterns` anpassen
- `aiCommitLite.maxDiffCharacters` reduzieren

### Quota- oder Rate-Limit-Probleme

Aktiviere `aiCommitLite.enableAutoFallback` und konfiguriere `aiCommitLite.profileFallbackOrder`.

### Reasoning-Modelle liefern inkonsistente Formatierung

- Behalte `aiCommitLite.commitMessageStyle = detailed` bei
- Erhöhe bei Bedarf `aiCommitLite.maxTokens`
- Wenn einige Reasoning-Modelle weiterhin nur eine Zeile zurückgeben, führt die Erweiterung automatisch eine Formatkorrektur durch

## Entwicklung

```bash
npm run compile
npm run watch
npm run lint
npm test
npm run package
```

Hinweis: Das Repository enthält `npm test`, das zuerst die Testziele kompiliert und dann Node-native Tests ausführt.

## License

[MIT](LICENSE)


# AI Commit Lite

VS Code-Erweiterung zur automatischen Generierung von Git-Commit-Nachrichten mit KI.

[**简体中文 / English 主要文檔 →**](README.md)

---

## Schnellstart

3 Schritte zum Start:

**1️⃣ Erweiterung installieren**
Wenn noch kein Profile existiert, erscheint nach der Installation ein Willkommenshinweis.

**2️⃣ KI einrichten**
「Add Profile」→「Anbieter wählen」→「API Key eingeben」
(Der Key wird sicher in VS Code Secret Storage gespeichert)

**3️⃣ Commit generieren**
```bash
git add .
```
Mit einer der folgenden Methoden generieren:
- Befehlspalette: `AI Commit Lite: Generate Commit`
- SCM-Titel-Schaltfläche
- `Ctrl+Shift+G Ctrl+Shift+C`

Die generierte Nachricht wird automatisch ins Source Control-Eingabefeld eingefügt.

## Funktionsübersicht

![Profile-Verwaltung](docs/images/01.png)
![Commit-Generierung](docs/images/02.png)

## Was kann es tun?

**Q: Welche Anbieter werden unterstützt?**
OpenAI, DeepSeek, Gemini, Anthropic, Cohere, Mistral, DashScope und OpenAI-kompatible APIs.

**Q: Sind API-Schlüssel sicher?**
Ja. Schlüssel werden in VS Code Secret Storage gespeichert und erscheinen nicht als Klartext in den Einstellungen.

**Q: Kann ich mehrere KI-Konfigurationen verwenden?**
Ja. Profile Manager ermöglicht das Erstellen mehrerer Konfigurationen für verschiedene Teams oder Konten. Automatischer Fallback ist konfigurierbar.

**Q: Kann ich das Ausgabeformat anpassen?**
Unterstützt `detailed` (detailliert, mit Aufzählungspunkten) und `concise` (kurz, nur eine Zeile).

**Q: Mehrsprachige Ausgabe?**
Unterstützte Sprachen: Englisch, vereinfachtes Chinesisch, Japanisch, Koreanisch, Spanisch, Französisch, Deutsch, Russisch, Portugiesisch, Italienisch (10 Sprachen).

## Unterstützte Anbieter

| Anbieter | Beschreibung |
| --- | --- |
| OpenAI | OpenAI-Originalmodelle |
| DeepSeek | DeepSeek-Originalmodelle |
| Gemini | Google Gemini |
| Anthropic | Anthropic Claude-Serie |
| Cohere | Command-Serie |
| Mistral | Mistral-Originalmodelle |
| DashScope | Alibaba Cloud 通義千問 |
| Azure OpenAI | OpenAI in Azure |
| OpenAI-Compatible | OpenRouter, selbst gehostete Dienste u.a. |

*Benutzerdefinierter Endpoint erforderlich: Azure OpenAI, OpenAI-Compatible*

## Befehle

| Befehl | Beschreibung |
| --- | --- |
| `AI Commit Lite: Generate Commit` | Commit-Nachricht generieren |
| `AI Commit Lite: Open Profile Manager` | Einstellungen öffnen |
| `AI Commit Lite: Switch Profile` | Profile wechseln |
| `AI Commit Lite: Add Profile` | Neues Profile hinzufügen |
| `AI Commit Lite: Edit Profile` | Profile bearbeiten |
| `AI Commit Lite: Delete Profile` | Profile löschen |

**Tastenkombination**: `Ctrl+Shift+G Ctrl+Shift+C` (Windows/Linux), `Cmd+Shift+G Cmd+Shift+C` (macOS)

## Einstellungen

| Einstellung | Standardwert | Beschreibung |
| --- | --- | --- |
| `aiCommitLite.language` | `en` | Ausgabesprache |
| `aiCommitLite.useGitmoji` | `true` | Gitmoji verwenden |
| `aiCommitLite.commitMessageStyle` | `detailed` | `detailed` oder `concise` |
| `aiCommitLite.enableAutoFallback` | `true` | Automatischen Fallback aktivieren |
| `aiCommitLite.profileFallbackOrder` | `[]` | Fallback-Prioritätsreihenfolge |
| `aiCommitLite.maxDiffCharacters` | `24000` | Gesamtlimit für Diff-Zeichen |
| `aiCommitLite.maxFileDiffCharacters` | `8000` | Limit pro Datei |

## Fehlerbehebung

**Profile nicht sichtbar?**
- Klicke auf "AI Commit Lite" in der Statusleiste
- Oder führe `AI Commit Lite: Open Profile Manager` aus

**Keine gestafften Änderungen?**
Führe zuerst `git add .` aus.

**Generation zu langsam?**
- Vermeide es, große oder Binärdateien zu stagen
- Passe `aiCommitLite.contextExcludePatterns` an

**Rate-Limit oder Kontingent erreicht?**
1. Aktiviere `aiCommitLite.enableAutoFallback`
2. Setze die Fallback-Priorität im Profile Manager

**Inkonsistente Formatierung bei Reasoning-Modellen?**
Behalte `aiCommitLite.commitMessageStyle = detailed` bei. Die Erweiterung korrigiert das Format automatisch.

---

## Für Entwickler

**Anforderungen**: Node.js 18+ / VS Code 1.80+

**Befehle**:
```bash
npm run compile   # Kompilieren
npm run watch     # Überwachungsmodus
npm run lint      # Linting
npm test          # Tests
npm run package   # Verpacken
```

## License

[MIT](LICENSE)
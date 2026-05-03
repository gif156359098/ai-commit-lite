# AI Commit Lite

Extension VS Code qui utilise l'IA pour générer automatiquement des messages de commit Git.

[**简体中文 / English 主文档 →**](README.md)

---

## Démarrage Rapide

3 étapes pour commencer:

**1️⃣ Installer l'extension**
Si aucun Profile n'existe, une notification de bienvenue apparaîtra après l'installation.

**2️⃣ Configurer l'IA**
「Add Profile」→「Sélectionner un fournisseur」→「Entrer la clé API」
(La clé est stockée de manière sécurisée dans VS Code Secret Storage)

**3️⃣ Générer le commit**
```bash
git add .
```
Générer avec l'une de ces méthodes:
- Palette de commandes: `AI Commit Lite: Generate Commit`
- Bouton du titre SCM
- `Ctrl+Shift+G Ctrl+Shift+C`

Le message généré sera automatiquement inséré dans le champ Source Control.

## Aperçu

![Gestion des Profile](docs/images/01.png)
![Génération de commit](docs/images/02.png)

## Ce qu'il peut faire

**Q: Quels fournisseurs sont pris en charge?**
OpenAI, DeepSeek, Gemini, Anthropic, Cohere, Mistral, DashScope et les APIs compatibles OpenAI.

**Q: Les clés API sont-elles sécurisées?**
Oui. Les clés sont stockées dans VS Code Secret Storage et n'apparaissent pas en texte brut dans les paramètres.

**Q: Puis-je utiliser plusieurs configurations IA?**
Oui. Profile Manager permet de créer plusieurs configurations pour différentes équipes ou comptes. Le fallback automatique est également configurable.

**Q: Puis-je ajuster le format de sortie?**
Prend en charge `detailed` (détaillé, avec des points) et `concise` (concis, une seule ligne).

**Q: Sortie multilingue?**
Languesprises en charge: anglais, chinois simplifié, japonais, coréen, espagnol, français, allemand, russe, portugais, italien (10 langues).

## Fournisseurs Pris en Charge

| Fournisseur | Description |
| --- | --- |
| OpenAI | Modèles officiels OpenAI |
| DeepSeek | Modèles officiels DeepSeek |
| Gemini | Google Gemini |
| Anthropic | Série Claude d'Anthropic |
| Cohere | Série Command |
| Mistral | Modèles officiels Mistral |
| DashScope | Tongyi Qianwen d'Alibaba Cloud |
| Azure OpenAI | OpenAI sur Azure |
| OpenAI-Compatible | OpenRouter, services auto-hébergés, etc. |

*Endpoint personnalisé requis: Azure OpenAI, OpenAI-Compatible*

## Commandes

| Commande | Description |
| --- | --- |
| `AI Commit Lite: Generate Commit` | Générer le message de commit |
| `AI Commit Lite: Open Profile Manager` | Ouvrir les paramètres |
| `AI Commit Lite: Switch Profile` | Changer de Profile |
| `AI Commit Lite: Add Profile` | Ajouter un nouveau Profile |
| `AI Commit Lite: Edit Profile` | Modifier le Profile |
| `AI Commit Lite: Delete Profile` | Supprimer le Profile |

**Raccourci**: `Ctrl+Shift+G Ctrl+Shift+C` (Windows/Linux), `Cmd+Shift+G Cmd+Shift+C` (macOS)

## Paramètres

| Paramètre | Valeur par défaut | Description |
| --- | --- | --- |
| `aiCommitLite.language` | `en` | Langue de sortie |
| `aiCommitLite.useGitmoji` | `true` | Utiliser Gitmoji |
| `aiCommitLite.commitMessageStyle` | `detailed` | `detailed` ou `concise` |
| `aiCommitLite.enableAutoFallback` | `true` | Activer le fallback automatique |
| `aiCommitLite.profileFallbackOrder` | `[]` | Priorité de fallback |
| `aiCommitLite.maxDiffCharacters` | `24000` | Limite totale de caractères diff |
| `aiCommitLite.maxFileDiffCharacters` | `8000` | Limite par fichier |

## Dépannage

**Profile non visible?**
- Cliquez sur "AI Commit Lite" dans la barre d'état
- Ou exécutez `AI Commit Lite: Open Profile Manager`

**Aucune modification stagée?**
Exécutez d'abord `git add .`.

**Génération lente?**
- Évitez de stage des fichiers volumineux ou binaires inutiles
- Ajustez `aiCommitLite.contextExcludePatterns`

**Limite de taux ou quota atteint?**
1. Activez `aiCommitLite.enableAutoFallback`
2. Configurez la priorité de fallback dans Profile Manager

**Formatage incohérent des modèles de raisonnement?**
Gardez `aiCommitLite.commitMessageStyle = detailed`. L'extension corrigera automatiquement le format.

---

## Pour les Développeurs

**Configuration requise**: Node.js 18+ / VS Code 1.80+

**Commandes**:
```bash
npm run compile   # Compiler
npm run watch     # Mode surveillance
npm run lint      # Linting
npm test          # Tests
npm run package   # Empaqueter
```

## License

[MIT](LICENSE)
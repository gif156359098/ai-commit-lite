# AI Commit Lite

Consultez la version bilingue chinois-anglais dans [README.md](README.md).

AI Commit Lite est une extension VS Code qui utilise l'IA pour générer des messages de commit à partir des changements Git déjà indexés. La version actuelle n'utilise plus l'ancien flux basé sur une seule configuration fournisseur ; elle repose désormais sur `Profile Manager` pour gérer plusieurs fournisseurs et plusieurs modèles.

## Fonctionnalités

- `Profile Manager` visuel
- Prise en charge de OpenAI, Azure OpenAI, DeepSeek, Gemini, Anthropic, Cohere, Mistral, Qwen / DashScope et des services OpenAI-Compatible
- Stockage sécurisé des API keys via VS Code Secret Storage
- Deux styles de commit : `detailed` et `concise`
- Correction automatique du format : si un modèle ne respecte pas le format détaillé requis, l'extension exécute automatiquement une correction
- Support de Gitmoji et Conventional Commits
- Bascule automatique vers des profils de secours
- Génération multilingue
- Optimisation du Git diff : analyse par lots des modifications indexées, réduisant le temps d'attente du diff séquentiel par fichier
- Accès depuis la barre d'état, le bouton SCM, la palette de commandes et un raccourci clavier

## Installation

### Installer un fichier `.vsix`

1. Exécutez `Extensions: Install from VSIX...` dans VS Code
2. Sélectionnez le fichier `.vsix`

### Construire depuis les sources

```bash
git clone https://github.com/gif156359098/ai-commit-lite.git
cd ai-commit-lite
npm install
npm run compile
npm run package
```

## Tutoriel d'utilisation

### 1. Ouvrir Profile Manager

Vous pouvez l'ouvrir depuis :

- la barre d'état avec `AI Commit Lite`
- la palette de commandes avec `AI Commit Lite: Open Profile Manager`

Si aucun profil n'existe après l'installation, l'extension affiche automatiquement une notification d'onboarding.

### 2. Ajouter un profil

1. Cliquez sur `Add Profile`
2. Choisissez le fournisseur
3. Saisissez le nom d'affichage
4. Saisissez le modèle
5. Saisissez l'API key
6. Si vous utilisez `Azure OpenAI` ou `OpenAI-Compatible`, renseignez aussi l'Endpoint / Base URL
7. Enregistrez

Remarques :

- Si vous laissez le champ API key vide lors d'une modification, la clé existante est conservée
- Le premier profil créé devient automatiquement le profil actif

### 3. Indexer vos changements

```bash
git add .
```

### 4. Générer le message de commit

Entrées disponibles :

- `AI Commit Lite: Generate Commit`
- bouton dans le titre SCM
- `Ctrl+Shift+G Ctrl+Shift+C`
- macOS : `Cmd+Shift+G Cmd+Shift+C`

Le message généré est inséré automatiquement dans la zone de saisie Source Control.

### 5. Choisir le style du commit

Réglez `aiCommitLite.commitMessageStyle` :

- `detailed` : une ligne de sujet + 2 à 5 puces
- `concise` : uniquement une ligne de sujet

Si le modèle ne respecte pas le format détaillé, l'extension tente une correction automatique une seule fois.

## Fournisseurs pris en charge

| Fournisseur | Usage typique | Endpoint personnalisé |
| --- | --- | --- |
| OpenAI | Modèles officiels OpenAI | Non |
| Azure OpenAI | Modèles OpenAI déployés sur Azure | Oui |
| DeepSeek | Modèles officiels DeepSeek | Non |
| Gemini | Modèles officiels Google Gemini | Non |
| Anthropic | Modèles officiels Claude | Non |
| Cohere | Modèles officiels Cohere / Command | Non |
| Mistral | Modèles officiels Mistral | Non |
| Qwen / DashScope | Modèles Alibaba Cloud DashScope | Non |
| OpenAI-Compatible | OpenRouter, passerelles compatibles, services auto-hébergés compatibles, etc. | Oui |

## Paramètres importants

| Paramètre | Valeur par défaut | Description |
| --- | --- | --- |
| `aiCommitLite.language` | `en` | Langue de sortie |
| `aiCommitLite.useGitmoji` | `true` | Utiliser Gitmoji |
| `aiCommitLite.conventionalCommits` | `true` | Utiliser Conventional Commits |
| `aiCommitLite.commitMessageStyle` | `detailed` | Style de sortie |
| `aiCommitLite.customSystemPrompt` | `""` | Prompt système personnalisé |
| `aiCommitLite.temperature` | `0.7` | Température du modèle |
| `aiCommitLite.maxTokens` | `1000` | Nombre maximal de tokens en sortie |
| `aiCommitLite.maxDiffCharacters` | `24000` | Limite globale du diff |
| `aiCommitLite.maxFileDiffCharacters` | `8000` | Limite par fichier |
| `aiCommitLite.contextExcludePatterns` | valeurs par défaut intégrés | Modèles exclus de l'analyse de diff |
| `aiCommitLite.enableAutoFallback` | `true` | Activer le fallback automatique |
| `aiCommitLite.profileFallbackOrder` | `[]` | Ordre de fallback |
| `aiCommitLite.profiles` | `[]` | Métadonnées des profils stockés |
| `aiCommitLite.activeProfile` | `""` | ID du profil actif |

## Commandes

- `AI Commit Lite: Generate Commit`
- `AI Commit Lite: Switch Profile`
- `AI Commit Lite: Add Profile`
- `AI Commit Lite: Edit Profile`
- `AI Commit Lite: Delete Profile`
- `AI Commit Lite: Open Profile Manager`

## Dépannage

### Je ne vois pas mes profils

- Exécutez `AI Commit Lite: Open Profile Manager`
- Vérifiez qu'au moins un profil a été créé

### Aucun changement indexé

Exécutez d'abord `git add`.

### La génération est lente

- Évitez d'indexer des fichiers binaires ou très volumineux si ce n'est pas nécessaire
- Ajustez `aiCommitLite.contextExcludePatterns`
- Réduisez `aiCommitLite.maxDiffCharacters`

### Problèmes de quota ou de rate limit

Activez `aiCommitLite.enableAutoFallback` et configurez `aiCommitLite.profileFallbackOrder`.

### Les modèles de raisonnement renvoient un format incohérent

- Gardez `aiCommitLite.commitMessageStyle = detailed`
- Augmentez `aiCommitLite.maxTokens` si nécessaire
- Si certains modèles de raisonnement continuent de ne renvoyer qu'une seule ligne, l'extension exécutera automatiquement une correction de format

## Développement

#### Prérequis

- Node.js 18+
- VS Code 1.80+

#### Commandes

```bash
npm run compile
npm run watch
npm run lint
npm run package
```

Remarque : le dépôt n'inclut pas actuellement de script de test intégré.

## License

[MIT](LICENSE)


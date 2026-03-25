# AI Commit Lite

Consulta la versión bilingüe chino-inglés en [README.md](README.md).

AI Commit Lite es una extensión de VS Code que usa IA para generar mensajes de commit a partir de los cambios preparados en Git. La versión actual ya no depende del antiguo flujo de una sola configuración de proveedor; ahora utiliza un flujo basado en `Profile Manager` para manejar varios proveedores y modelos.

## Funciones principales

- `Profile Manager` visual
- Soporte para OpenAI, Azure OpenAI, DeepSeek, Gemini, Anthropic, Cohere, Mistral, Qwen / DashScope y servicios OpenAI-Compatible
- Almacenamiento seguro de API keys con VS Code Secret Storage
- Dos estilos de commit: `detailed` y `concise`
- Corrección automática de formato: si un modelo no sigue el formato detallado requerido, la extensión ejecuta una corrección automática
- Soporte para Gitmoji y Conventional Commits
- Cambio automático a perfiles de respaldo
- Salida de mensajes de commit en varios idiomas
- Optimización de Git diff: análisis por lotes de los cambios preparados, reduciendo el tiempo de espera del diff secuencial por archivo
- Acceso desde barra de estado, botón SCM, paleta de comandos y atajo de teclado

## Instalación

### Instalar un `.vsix`

1. Ejecuta `Extensions: Install from VSIX...` en VS Code
2. Selecciona el archivo `.vsix`

### Compilar desde el código fuente

```bash
git clone https://github.com/gif156359098/ai-commit-lite.git
cd ai-commit-lite
npm install
npm run compile
npm run package
```

## Tutorial de uso

### 1. Abrir Profile Manager

Puedes abrirlo desde:

- La barra de estado con `AI Commit Lite`
- La paleta de comandos con `AI Commit Lite: Open Profile Manager`

Si instalas la extensión por primera vez y aún no existe ningún perfil, verás un mensaje de onboarding.

### 2. Crear un perfil

1. Haz clic en `Add Profile`
2. Elige el proveedor
3. Introduce el nombre para mostrar
4. Introduce el modelo
5. Introduce la API key
6. Si eliges `Azure OpenAI` u `OpenAI-Compatible`, añade también el Endpoint / Base URL
7. Guarda el perfil

Notas:

- Si editas un perfil y dejas vacía la API key, se conserva la clave anterior
- El primer perfil creado se activa automáticamente

### 3. Preparar cambios

```bash
git add .
```

### 4. Generar el mensaje de commit

Entradas disponibles:

- `AI Commit Lite: Generate Commit`
- Botón del título de SCM
- `Ctrl+Shift+G Ctrl+Shift+C`
- macOS: `Cmd+Shift+G Cmd+Shift+C`

El mensaje generado se inserta automáticamente en el cuadro de entrada de Source Control.

### 5. Elegir el estilo del commit

Configura `aiCommitLite.commitMessageStyle`:

- `detailed`: una línea de asunto + 2 a 5 viñetas
- `concise`: solo una línea de asunto

Si el modelo no respeta el formato detallado, la extensión intenta una corrección automática una vez.

## Proveedores compatibles

| Proveedor | Uso típico | Endpoint personalizado |
| --- | --- | --- |
| OpenAI | Modelos oficiales de OpenAI | No |
| Azure OpenAI | Modelos de OpenAI desplegados en Azure | Sí |
| DeepSeek | Modelos oficiales de DeepSeek | No |
| Gemini | Modelos oficiales de Google Gemini | No |
| Anthropic | Modelos oficiales de Claude | No |
| Cohere | Modelos oficiales de Cohere / Command | No |
| Mistral | Modelos oficiales de Mistral | No |
| Qwen / DashScope | Modelos de Alibaba Cloud DashScope | No |
| OpenAI-Compatible | OpenRouter, gateways compatibles, servicios autoalojados compatibles y similares | Sí |

## Ajustes importantes

| Ajuste | Valor por defecto | Descripción |
| --- | --- | --- |
| `aiCommitLite.language` | `en` | Idioma de salida |
| `aiCommitLite.useGitmoji` | `true` | Usar Gitmoji |
| `aiCommitLite.conventionalCommits` | `true` | Usar Conventional Commits |
| `aiCommitLite.commitMessageStyle` | `detailed` | Estilo de salida |
| `aiCommitLite.customSystemPrompt` | `""` | Prompt del sistema personalizado |
| `aiCommitLite.temperature` | `0.7` | Temperatura del modelo |
| `aiCommitLite.maxTokens` | `1000` | Máximo de tokens de salida |
| `aiCommitLite.maxDiffCharacters` | `24000` | Límite total del diff |
| `aiCommitLite.maxFileDiffCharacters` | `8000` | Límite por archivo |
| `aiCommitLite.contextExcludePatterns` | valores predeterminados integrados | Patrones excluidos del análisis de diff |
| `aiCommitLite.enableAutoFallback` | `true` | Activar fallback automático |
| `aiCommitLite.profileFallbackOrder` | `[]` | Orden de fallback |

## Solución de problemas

### No veo mis perfiles

- Ejecuta `AI Commit Lite: Open Profile Manager`
- Verifica que hayas creado al menos un perfil

### No hay cambios preparados

Ejecuta primero `git add`.

### La generación es lenta

- Evita preparar archivos binarios o muy grandes si no son necesarios
- Ajusta `aiCommitLite.contextExcludePatterns`
- Reduce `aiCommitLite.maxDiffCharacters`

### Problemas de cuota o rate limit

Activa `aiCommitLite.enableAutoFallback` y configura `aiCommitLite.profileFallbackOrder`.

### Modelos de razonamiento devuelven formato inconsistente

- Mantén `aiCommitLite.commitMessageStyle = detailed`
- Aumenta `aiCommitLite.maxTokens` cuando sea necesario
- Si algunos modelos de razonamiento siguen devolviendo solo una línea, la extensión ejecutará automáticamente una corrección de formato

## Desarrollo

```bash
npm run compile
npm run watch
npm run lint
npm test
npm run package
```

Nota: el repositorio incluye `npm test`, que primero compila los objetivos de prueba y luego ejecuta las pruebas nativas de Node.

## License

[MIT](LICENSE)


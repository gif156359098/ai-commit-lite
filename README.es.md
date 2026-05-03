# AI Commit Lite

Extensión de VS Code que utiliza IA para generar automáticamente mensajes de commit de Git.

[**简体中文 / English 文档主文件 →**](README.md)

---

## Inicio Rápido

3 pasos para comenzar:

**1️⃣ Instalar la extensión**
Si no existe ningún Profile, aparecerá una notificación de bienvenida después de la instalación.

**2️⃣ Configurar IA**
「Add Profile」→「Seleccionar proveedor」→「Ingresar API Key」
(La clave se almacena de forma segura en VS Code Secret Storage)

**3️⃣ Generar commit**
```bash
git add .
```
Generar con cualquiera de estos métodos:
- Paleta de comandos: `AI Commit Lite: Generate Commit`
- Botón del título SCM
- `Ctrl+Shift+G Ctrl+Shift+C`

El mensaje generado se inserta automáticamente en el campo de entrada de Source Control.

## Vista Previa

![Gestión de Profile](docs/images/01.png)
![Generación de commit](docs/images/02.png)

## Qué puede hacer

**Q: ¿Qué proveedores soporta?**
OpenAI, DeepSeek, Gemini, Anthropic, Cohere, Mistral, DashScope y APIs compatibles con OpenAI.

**Q: ¿Las API keys son seguras?**
Sí. Las claves se almacenan en VS Code Secret Storage y no aparecen como texto plano en la configuración.

**Q: ¿Puedo usar múltiples configuraciones de IA?**
Sí. Profile Manager permite crear múltiples configuraciones para diferentes equipos o cuentas. El fallback automático también es configurable.

**Q: ¿Puedo ajustar el formato de salida?**
Soporta `detailed` (detallado, con viñetas) y `concise` (conciso, solo una línea).

**Q: ¿Salida multilingüe?**
Idiomas compatibles: inglés, chino simplificado, japonés, coreano, español, francés, alemán, ruso, portugués, italiano (10 idiomas).

## Proveedores Compatibles

| Proveedor | Descripción |
| --- | --- |
| OpenAI | Modelos oficiales de OpenAI |
| DeepSeek | Modelos oficiales de DeepSeek |
| Gemini | Google Gemini |
| Anthropic | Serie Claude de Anthropic |
| Cohere | Serie Command |
| Mistral | Modelos oficiales de Mistral |
| DashScope | Tongyi Qianwen de Alibaba Cloud |
| Azure OpenAI | OpenAI en Azure |
| OpenAI-Compatible | OpenRouter, servicios autoalojados, etc. |

*Endpoint personalizado necesario: Azure OpenAI, OpenAI-Compatible*

## Comandos

| Comando | Descripción |
| --- | --- |
| `AI Commit Lite: Generate Commit` | Generar mensaje de commit |
| `AI Commit Lite: Open Profile Manager` | Abrir configuración |
| `AI Commit Lite: Switch Profile` | Cambiar Profile |
| `AI Commit Lite: Add Profile` | Añadir nuevo Profile |
| `AI Commit Lite: Edit Profile` | Editar Profile |
| `AI Commit Lite: Delete Profile` | Eliminar Profile |

**Atajo**: `Ctrl+Shift+G Ctrl+Shift+C` (Windows/Linux), `Cmd+Shift+G Cmd+Shift+C` (macOS)

## Configuración

| Ajuste | Valor predeterminado | Descripción |
| --- | --- | --- |
| `aiCommitLite.language` | `en` | Idioma de salida |
| `aiCommitLite.useGitmoji` | `true` | Usar Gitmoji |
| `aiCommitLite.commitMessageStyle` | `detailed` | `detailed` o `concise` |
| `aiCommitLite.enableAutoFallback` | `true` | Habilitar fallback automático |
| `aiCommitLite.profileFallbackOrder` | `[]` | Prioridad de fallback |
| `aiCommitLite.maxDiffCharacters` | `24000` | Límite total de caracteres diff |
| `aiCommitLite.maxFileDiffCharacters` | `8000` | Límite por archivo |

## Solución de Problemas

**¿No puedo ver Profile?**
- Haz clic en "AI Commit Lite" en la barra de estado
- O ejecuta `AI Commit Lite: Open Profile Manager`

**Dice que no hay cambios staged?**
Primero ejecuta `git add .`.

**La generación es lenta?**
- Evita hacer staging de archivos grandes o binarios innecesarios
- Ajusta `aiCommitLite.contextExcludePatterns`

**¿Rate limit o cuota agotada?**
1. Activa `aiCommitLite.enableAutoFallback`
2. Configura la prioridad de fallback en Profile Manager

**¿Los modelos de razonamiento dan formato inconsistente?**
Mantén `aiCommitLite.commitMessageStyle = detailed`. La extensión corregirá el formato automáticamente.

---

## Para Desarrolladores

**Requisitos**: Node.js 18+ / VS Code 1.80+

**Comandos**:
```bash
npm run compile   # Compilar
npm run watch     # Modo de vigilancia
npm run lint      # Linting
npm test          # Pruebas
npm run package   # Empaquetar
```

## License

[MIT](LICENSE)
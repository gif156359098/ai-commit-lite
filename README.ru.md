# AI Commit Lite

Расширение VS Code, которое использует ИИ для автоматической генерации сообщений коммитов Git.

[**简体中文 / English 主文档 →**](README.md)

---

## Быстрый старт

3 шага для начала работы:

**1️⃣ Установите расширение**
Если профиля не существует, after установки появится уведомление о приветствии.

**2️⃣ Настройте ИИ**
「Add Profile」→「Выберите провайдера」→「Введите API Key」
(Ключ безопасно хранится в VS Code Secret Storage)

**3️⃣ Создайте коммит**
```bash
git add .
```
Создайте любым из этих способов:
- Палета команд: `AI Commit Lite: Generate Commit`
- Кнопка в заголовке SCM
- `Ctrl+Shift+G Ctrl+Shift+C`

Сгенерированное сообщение будет автоматически вставлено в поле Source Control.

## Превью

![Управление Profile](docs/images/01.png)
![Создание коммита](docs/images/02.png)

## Возможности

**Q: Какие провайдеры поддерживаются?**
OpenAI, DeepSeek, Gemini, Anthropic, Cohere, Mistral, DashScope и API, совместимые с OpenAI.

**Q: API-ключи безопасны?**
Да. Ключи хранятся в VS Code Secret Storage и не отображаются открытым текстом в настройках.

**Q: Могу ли я использовать несколько конфигураций ИИ?**
Да. Profile Manager позволяет создавать несколько конфигураций для разных команд или аккаунтов. Автоматический fallback также настраивается.

**Q: Могу ли я настроить формат вывода?**
Поддерживается `detailed` (подробный, со списком пунктов) и `concise` (краткий, одна строка).

**Q: Многоязычный вывод?**
Поддерживаемые языки: английский, упрощённый китайский, японский, корейский, испанский, французский, немецкий, русский, португальский, итальянский (10 языков).

## Поддерживаемые провайдеры

| Провайдер | Описание |
| --- | --- |
| OpenAI | Официальные модели OpenAI |
| DeepSeek | Официальные модели DeepSeek |
| Gemini | Google Gemini |
| Anthropic | Серия Claude от Anthropic |
| Cohere | Серия Command |
| Mistral | Официальные модели Mistral |
| DashScope | Tongyi Qianwen от Alibaba Cloud |
| Azure OpenAI | OpenAI в Azure |
| OpenAI-Compatible | OpenRouter, self-hosted сервисы и др. |

*Пользовательский Endpoint требуется: Azure OpenAI, OpenAI-Compatible*

## Команды

| Команда | Описание |
| --- | --- |
| `AI Commit Lite: Generate Commit` | Создать сообщение коммита |
| `AI Commit Lite: Open Profile Manager` | Открыть настройки |
| `AI Commit Lite: Switch Profile` | Переключить Profile |
| `AI Commit Lite: Add Profile` | Добавить новый Profile |
| `AI Commit Lite: Edit Profile` | Редактировать Profile |
| `AI Commit Lite: Delete Profile` | Удалить Profile |

**Горячая клавиша**: `Ctrl+Shift+G Ctrl+Shift+C` (Windows/Linux), `Cmd+Shift+G Cmd+Shift+C` (macOS)

## Настройки

| Настройка | Значение по умолчанию | Описание |
| --- | --- | --- |
| `aiCommitLite.language` | `en` | Язык вывода |
| `aiCommitLite.useGitmoji` | `true` | Использовать Gitmoji |
| `aiCommitLite.commitMessageStyle` | `detailed` | `detailed` или `concise` |
| `aiCommitLite.enableAutoFallback` | `true` | Включить автоматический fallback |
| `aiCommitLite.profileFallbackOrder` | `[]` | Приоритет fallback |
| `aiCommitLite.maxDiffCharacters` | `24000` | Общий лимит символов diff |
| `aiCommitLite.maxFileDiffCharacters` | `8000` | Лимит на файл |

## Устранение проблем

**Profile не отображается?**
- Нажмите "AI Commit Lite" в строке состояния
- Или выполните `AI Commit Lite: Open Profile Manager`

**Нет проиндексированных изменений?**
Сначала выполните `git add .`.

**Генерация медленная?**
- Избегайте индексации больших или бинарных файлов
- Настройте `aiCommitLite.contextExcludePatterns`

**Достигнут лимит запросов или квота?**
1. Включите `aiCommitLite.enableAutoFallback`
2. Настройте приоритет fallback в Profile Manager

**Нестабильный формат у моделей рассуждений?**
Сохраняйте `aiCommitLite.commitMessageStyle = detailed`. Расширение автоматически исправит формат.

---

## Для разработчиков

**Требования**: Node.js 18+ / VS Code 1.80+

**Команды**:
```bash
npm run compile   # Компиляция
npm run watch     # Режим наблюдения
npm run lint      # Линтинг
npm test          # Тесты
npm run package   # Упаковка
```

## License

[MIT](LICENSE)
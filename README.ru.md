# AI Commit Lite

См. двуязычную китайско-английскую версию в [README.md](README.md).

AI Commit Lite — это расширение VS Code, которое использует ИИ для генерации сообщений коммита на основе текущих изменений Git в staging. Текущая версия больше не использует старый поток с одной конфигурацией провайдера; теперь расширение работает через `Profile Manager`, чтобы удобно управлять несколькими провайдерами и моделями.

## Возможности

- Визуальный `Profile Manager`
- Поддержка OpenAI, Azure OpenAI, DeepSeek, Gemini, Anthropic, Cohere, Mistral, Qwen / DashScope и сервисов OpenAI-Compatible
- Безопасное хранение API-ключей через VS Code Secret Storage
- Два стиля коммита: `detailed` и `concise`
- Автоматическое исправление формата: если модель не следует требуемому подробному формату, расширение выполняет автоматическое исправление
- Поддержка Gitmoji и Conventional Commits
- Автоматический переход на резервные профили
- Многоязычная генерация сообщений коммита
- Оптимизация Git diff: пакетный анализ изменений в staging, сокращение времени ожидания последовательного diff по файлам
- Доступ через строку состояния, кнопку SCM, палитру команд и горячую клавишу

## Установка

### Установка `.vsix`

1. Выполните `Extensions: Install from VSIX...` в VS Code
2. Выберите файл `.vsix`

### Сборка из исходников

```bash
git clone https://github.com/gif156359098/ai-commit-lite.git
cd ai-commit-lite
npm install
npm run compile
npm run package
```

## Руководство по использованию

### 1. Откройте Profile Manager

Вы можете открыть его через:

- `AI Commit Lite` в строке состояния
- `AI Commit Lite: Open Profile Manager` в палитре команд

Если после установки еще нет ни одного профиля, расширение автоматически покажет onboarding-подсказку.

### 2. Создайте профиль

1. Нажмите `Add Profile`
2. Выберите провайдера
3. Укажите отображаемое имя
4. Укажите модель
5. Укажите API key
6. Если выбран `Azure OpenAI` или `OpenAI-Compatible`, укажите также Endpoint / Base URL
7. Сохраните профиль

Примечания:

- Если при редактировании оставить поле API key пустым, существующий ключ будет сохранен
- Первый созданный профиль автоматически становится активным

### 3. Поместите изменения в staging

```bash
git add .
```

### 4. Сгенерируйте сообщение коммита

Доступные точки входа:

- `AI Commit Lite: Generate Commit`
- Кнопка в заголовке SCM
- `Ctrl+Shift+G Ctrl+Shift+C`
- macOS: `Cmd+Shift+G Cmd+Shift+C`

Сгенерированное сообщение автоматически вставляется в поле ввода Source Control.

### 5. Выберите стиль коммита

Настройте `aiCommitLite.commitMessageStyle`:

- `detailed`: одна строка темы + 2–5 пунктов
- `concise`: только одна строка темы

Если модель не соблюдает подробный формат, расширение один раз попробует автоматически исправить формат.

## Поддерживаемые провайдеры

| Провайдер | Типичный сценарий | Нужен свой Endpoint |
| --- | --- | --- |
| OpenAI | Официальные модели OpenAI | Нет |
| Azure OpenAI | Модели OpenAI, развернутые в Azure | Да |
| DeepSeek | Официальные модели DeepSeek | Нет |
| Gemini | Официальные модели Google Gemini | Нет |
| Anthropic | Официальные модели Claude | Нет |
| Cohere | Официальные модели Cohere / Command | Нет |
| Mistral | Официальные модели Mistral | Нет |
| Qwen / DashScope | Модели Alibaba Cloud DashScope | Нет |
| OpenAI-Compatible | OpenRouter, совместимые шлюзы, self-hosted совместимые API и похожие сервисы | Да |

## Важные настройки

| Настройка | Значение по умолчанию | Описание |
| --- | --- | --- |
| `aiCommitLite.language` | `en` | Язык вывода |
| `aiCommitLite.useGitmoji` | `true` | Использовать Gitmoji |
| `aiCommitLite.conventionalCommits` | `true` | Использовать Conventional Commits |
| `aiCommitLite.commitMessageStyle` | `detailed` | Стиль вывода |
| `aiCommitLite.customSystemPrompt` | `""` | Пользовательский системный prompt |
| `aiCommitLite.temperature` | `0.7` | Температура модели |
| `aiCommitLite.maxTokens` | `1000` | Максимум выходных токенов |
| `aiCommitLite.maxDiffCharacters` | `24000` | Общий лимит diff |
| `aiCommitLite.maxFileDiffCharacters` | `8000` | Лимит diff на файл |
| `aiCommitLite.contextExcludePatterns` | встроенные значения по умолчанию | Шаблоны, исключаемые из анализа diff |
| `aiCommitLite.enableAutoFallback` | `true` | Включить автоматический fallback |
| `aiCommitLite.profileFallbackOrder` | `[]` | Порядок fallback |
| `aiCommitLite.profiles` | `[]` | Сохраненные метаданные профилей |
| `aiCommitLite.activeProfile` | `""` | ID активного профиля |

## Команды

- `AI Commit Lite: Generate Commit`
- `AI Commit Lite: Switch Profile`
- `AI Commit Lite: Add Profile`
- `AI Commit Lite: Edit Profile`
- `AI Commit Lite: Delete Profile`
- `AI Commit Lite: Open Profile Manager`

## Устранение неполадок

### Профили не отображаются

- Выполните `AI Commit Lite: Open Profile Manager`
- Убедитесь, что создан хотя бы один профиль

### Нет изменений в staging

Сначала выполните `git add`.

### Генерация работает медленно

- Не добавляйте в staging большие бинарные или сгенерированные файлы без необходимости
- Настройте `aiCommitLite.contextExcludePatterns`
- Уменьшите `aiCommitLite.maxDiffCharacters`

### Проблемы с квотой или rate limit

Включите `aiCommitLite.enableAutoFallback` и настройте `aiCommitLite.profileFallbackOrder`.

### Модели рассуждения возвращают нестабильный формат

- Оставьте `aiCommitLite.commitMessageStyle = detailed`
- При необходимости увеличьте `aiCommitLite.maxTokens`
- Если некоторые модели рассуждения по-прежнему возвращают только одну строку, расширение автоматически выполнит корректировку формата

## Разработка

#### Требования

- Node.js 18+
- VS Code 1.80+

#### Команды

```bash
npm run compile
npm run watch
npm run lint
npm run package
```

Примечание: репозиторий не включает встроенный тестовый скрипт.

## License

[MIT](LICENSE)


# AI Commit Lite

기본 중영 이중 언어 문서는 [README.md](README.md)를 참고하세요.

AI Commit Lite는 현재 Git 스테이징 변경 사항을 바탕으로 AI가 커밋 메시지를 생성하는 VS Code 확장입니다. 현재 버전은 예전의 단일 공급자 설정 흐름 대신 `Profile Manager` 중심의 멀티 벤더 워크플로로 전환되었습니다.

## 주요 기능

- 시각적인 `Profile Manager`
- OpenAI, Azure OpenAI, DeepSeek, Gemini, Anthropic, Cohere, Mistral, Qwen / DashScope, OpenAI-Compatible 지원
- API 키를 VS Code Secret Storage에 안전하게 저장
- `detailed`, `concise` 두 가지 커밋 스타일
- 자동 형식 수정: 모델이 요구된 상세 형식을 따르지 않을 경우 확장이 자동으로 형식 수정 실행
- Gitmoji 및 Conventional Commits 지원
- 쿼터 또는 속도 제한 시 자동 폴백
- 다국어 커밋 메시지 출력
- Git diff 최적화: 스테이징된 변경 사항을 배치 분석하여 파일별 순차 diff 대기 시간 단축
- 상태 표시줄, SCM 버튼, 명령 팔레트, 단축키 지원

## 설치

### `.vsix` 설치

1. VS Code에서 `Extensions: Install from VSIX...` 실행
2. `.vsix` 파일 선택

### 소스에서 빌드

```bash
git clone https://github.com/gif156359098/ai-commit-lite.git
cd ai-commit-lite
npm install
npm run compile
npm run package
```

## 사용 튜토리얼

### 1. Profile Manager 열기

다음 중 하나를 사용하세요.

- 상태 표시줄의 `AI Commit Lite`
- 명령 팔레트의 `AI Commit Lite: Open Profile Manager`

처음 설치했고 Profile이 없으면 온보딩 알림이 자동으로 표시됩니다.

### 2. Profile 추가

1. `Add Profile` 클릭
2. 공급자 선택
3. 표시 이름 입력
4. 모델 이름 입력
5. API 키 입력
6. `Azure OpenAI` 또는 `OpenAI-Compatible` 선택 시 Endpoint / Base URL 추가 입력
7. 저장

참고:

- 편집 시 API 키를 비워 두면 기존 키가 유지됩니다
- 첫 번째 Profile은 자동으로 활성 Profile이 됩니다

### 3. 변경 사항 스테이징

```bash
git add .
```

### 4. 커밋 메시지 생성

사용 가능한 진입점:

- `AI Commit Lite: Generate Commit`
- SCM 제목 버튼
- `Ctrl+Shift+G Ctrl+Shift+C`
- macOS: `Cmd+Shift+G Cmd+Shift+C`

생성된 메시지는 Source Control 입력 상자에 자동으로 채워집니다.

### 5. 커밋 스타일 선택

`aiCommitLite.commitMessageStyle` 설정:

- `detailed`: 제목 1줄 + 2~5개의 불릿
- `concise`: 한 줄 제목만 출력

모델이 상세 형식을 지키지 않으면 확장이 한 번 자동으로 형식을 보정합니다.

## 지원 공급자

| 공급자 | 용도 | 사용자 Endpoint 필요 여부 |
| --- | --- | --- |
| OpenAI | 공식 OpenAI 모델 | 아니요 |
| Azure OpenAI | Azure에 배포된 OpenAI 모델 | 예 |
| DeepSeek | 공식 DeepSeek 모델 | 아니요 |
| Gemini | 공식 Google Gemini 모델 | 아니요 |
| Anthropic | 공식 Claude 모델 | 아니요 |
| Cohere | 공식 Cohere / Command 모델 | 아니요 |
| Mistral | 공식 Mistral 모델 | 아니요 |
| Qwen / DashScope | Alibaba Cloud DashScope 모델 | 아니요 |
| OpenAI-Compatible | OpenRouter, 호환 게이트웨이, 자체 호스팅 호환 API 등 | 예 |

## 주요 설정

| 설정 | 기본값 | 설명 |
| --- | --- | --- |
| `aiCommitLite.language` | `en` | 출력 언어 |
| `aiCommitLite.useGitmoji` | `true` | Gitmoji 사용 여부 |
| `aiCommitLite.conventionalCommits` | `true` | Conventional Commits 사용 여부 |
| `aiCommitLite.commitMessageStyle` | `detailed` | 출력 스타일 |
| `aiCommitLite.customSystemPrompt` | `""` | 사용자 시스템 프롬프트 |
| `aiCommitLite.temperature` | `0.7` | 생성 온도 |
| `aiCommitLite.maxTokens` | `1000` | 최대 출력 토큰 |
| `aiCommitLite.maxDiffCharacters` | `24000` | 전체 diff 한도 |
| `aiCommitLite.maxFileDiffCharacters` | `8000` | 파일별 diff 한도 |
| `aiCommitLite.contextExcludePatterns` | 내장 기본값 | diff 분석에서 제외되는 파일 패턴 |
| `aiCommitLite.enableAutoFallback` | `true` | 자동 폴백 사용 |
| `aiCommitLite.profileFallbackOrder` | `[]` | 폴백 순서 |

## 문제 해결

### Profile이 보이지 않음

- `AI Commit Lite: Open Profile Manager` 실행
- 최소 1개의 Profile이 생성되었는지 확인

### 스테이징된 변경 사항이 없다고 표시됨

먼저 `git add`를 실행하세요.

### 생성 속도가 느림

- 큰 생성물이나 바이너리 파일을 과도하게 스테이징하지 마세요
- `aiCommitLite.contextExcludePatterns` 조정
- `aiCommitLite.maxDiffCharacters` 축소

### 속도 제한 또는 쿼터 문제

`aiCommitLite.enableAutoFallback`를 활성화하고 `aiCommitLite.profileFallbackOrder`를 설정하세요.

### 추론 모델의 출력 형식이 불안정

- `aiCommitLite.commitMessageStyle = detailed` 유지
- 필요시 `aiCommitLite.maxTokens` 증가
- 일부 추론 모델이 여전히 한 줄만 반환할 경우 확장이 자동으로 형식 수정 실행

## 개발

```bash
npm run compile
npm run watch
npm run lint
npm test
npm run package
```

참고: 저장소에 `npm test`가 포함되어 있으며, 먼저 테스트 대상을 컴파일한 후 Node 기본 테스트를 실행합니다.

## License

[MIT](LICENSE)


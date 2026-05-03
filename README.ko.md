# AI Commit Lite

AI를 사용하여 Git 커밋 메시지를 자동으로 생성하는 VS Code 확장입니다.

[**简体中文 / English 병렬 문서 →**](README.md)

---

## 빠른 시작

3단계로 시작할 수 있습니다:

**1️⃣ 확장 설치**
Profile이 없으면 설치 후 온보딩 알림이 표시됩니다.

**2️⃣ AI 설정**
「Profile 추가」→「공급자 선택」→「API Key 입력」
(Key는 VS Code Secret Storage에 안전하게 저장됩니다)

**3️⃣ 커밋 생성**
```bash
git add .
```
다음 방법으로 생성:
- 명령 팔레트: `AI Commit Lite: Generate Commit`
- SCM 제목 버튼
- `Ctrl+Shift+G Ctrl+Shift+C`

생성 후 메시지는 Source Control 입력란에 자동 입력됩니다.

## 기능 미리보기

![Profile 관리](docs/images/01.png)
![커밋 생성](docs/images/02.png)

## 할 수 있는 것

**Q: 어떤 공급자를 지원합니까?**
OpenAI, DeepSeek, Gemini, Anthropic, Cohere, Mistral, DashScope, OpenAI 호환 API 등을 지원합니다.

**Q: API 키는 안전한가요?**
네. 키는 VS Code Secret Storage에 저장되며 일반 설정에 평문으로 저장되지 않습니다.

**Q: 여러 AI 설정을 사용할 수 있나요?**
네. Profile Manager에서 여러 설정을 만들고 서로 다른 팀이나 계정의 계정을 관리할 수 있습니다. 자동 폴백 순서도 설정 가능합니다.

**Q: 출력 형식을 조정할 수 있나요?**
`detailed`(상세 버전, 불릿 포인트 포함)와 `concise`(간단 버전, 한 줄만) 두 가지를 지원합니다.

**Q: 다국어 출력을 지원하나요?**
지원 언어: 영어, 중국어 간체, 일본어, 한국어, 스페인어, 프랑스어, 독일어, 러시아어, 포르투갈어, 이탈리아어 (10개 언어)

## 지원 공급자

| 공급자 | 설명 |
| --- | --- |
| OpenAI | OpenAI 공식 모델 |
| DeepSeek | DeepSeek 공식 모델 |
| Gemini | Google Gemini |
| Anthropic | Anthropic Claude 시리즈 |
| Cohere | Command 시리즈 |
| Mistral | Mistral 공식 모델 |
| DashScope | Alibaba Cloud 동이천문 (通義千問) |
| Azure OpenAI | Azure에 배포된 OpenAI |
| OpenAI-Compatible | OpenRouter, 자체 호스트 서비스 등 |

*사용자 정의 Endpoint 필요: Azure OpenAI, OpenAI-Compatible*

## 명령어

| 명령어 | 설명 |
| --- | --- |
| `AI Commit Lite: Generate Commit` | 커밋 메시지 생성 |
| `AI Commit Lite: Open Profile Manager` | 설정 화면 열기 |
| `AI Commit Lite: Switch Profile` | Profile 전환 |
| `AI Commit Lite: Add Profile` | 새 Profile 추가 |
| `AI Commit Lite: Edit Profile` | Profile 편집 |
| `AI Commit Lite: Delete Profile` | Profile 삭제 |

**단축키**: `Ctrl+Shift+G Ctrl+Shift+C` (Windows/Linux), `Cmd+Shift+G Cmd+Shift+C` (macOS)

## 설정

| 설정 | 기본값 | 설명 |
| --- | --- | --- |
| `aiCommitLite.language` | `en` | 출력 언어 |
| `aiCommitLite.useGitmoji` | `true` | Gitmoji 사용 여부 |
| `aiCommitLite.commitMessageStyle` | `detailed` | `detailed` 또는 `concise` |
| `aiCommitLite.enableAutoFallback` | `true` | 자동 폴백 활성화 |
| `aiCommitLite.profileFallbackOrder` | `[]` | 폴백 우선순위 |
| `aiCommitLite.maxDiffCharacters` | `24000` | 전체 diff 문자 수 상한 |
| `aiCommitLite.maxFileDiffCharacters` | `8000` | 파일당 상한 |

## 자주 묻는 질문

**Profile이 보이지 않아요?**
- 상태 표시줄의 "AI Commit Lite"를 클릭하세요
- 또는 `AI Commit Lite: Open Profile Manager`를 실행하세요

**스테이징된 변경이 없다고 표시되나요?**
먼저 `git add .`를 실행하세요.

**생성이 느려요?**
- 불필요한 큰 파일이나 바이너리를 스테이징하지 마세요
- `aiCommitLite.contextExcludePatterns`를 조정하세요

**레이트 리밋이나 할당량에 도달했나요?**
1. `aiCommitLite.enableAutoFallback`을 활성화하세요
2. Profile Manager에서 폴백 우선순위를 설정하세요

**추론 모델 출력이 불안정해요?**
`aiCommitLite.commitMessageStyle = detailed`를 유지하세요. 확장이 자동으로 형식을 수정합니다.

---

## 개발자 정보

**요구 사항**: Node.js 18+ / VS Code 1.80+

**명령어**:
```bash
npm run compile   # 컴파일
npm run watch     # 감시 모드
npm run lint      # 린트
npm test          # 테스트
npm run package   # 패키지
```

## License

[MIT](LICENSE)
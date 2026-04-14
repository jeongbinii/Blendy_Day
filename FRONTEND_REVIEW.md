# Blendy Day — 프론트엔드 현황 검토 문서

> 자문을 위한 실제 구현 상태 정리 문서입니다.
> README.md는 기획/설계 기준이며, 이 문서는 현재 코드 상태를 기준으로 작성되었습니다.

---

## 1. 프로젝트 개요

**서비스명**: Blendy Day  
**컨셉**: AI와의 채팅으로 감정 일기를 작성하고, 비슷한 하루를 보낸 익명의 타인과 공감을 나누는 소셜 다이어리 플랫폼

**기술 스택**

| 영역 | 기술 |
|---|---|
| Framework | React 19 + Vite |
| Routing | React Router DOM v7 |
| Styling | Tailwind CSS v4 |
| Icons | Lucide React |
| Container | Docker / Docker Compose |

> AI 연동(OpenAI API, LangChain), 인증, DB 등 백엔드는 **아직 미구현** 상태입니다.

---

## 2. 현재 구현 상태 요약

| 페이지 | 경로 | UI 구현 | 데이터 | 비고 |
|---|---|---|---|---|
| 랜딩(Home) | `/` | ✅ 완료 | — | 히어로 + 기능 소개 카드 |
| 로그인(Login) | `/login` | ✅ 완료 | ❌ 미연동 | 폼만 있고 인증 로직 없음 |
| AI 채팅(Chat) | `/chat` | ✅ 완료 | ❌ Mock | 실제 AI 대신 랜덤 문장 응답 |
| 일기 편집(DiaryEdit) | `/diary/edit` | ✅ 완료 | ❌ Mock | 하드코딩 초안 + 해시태그 |
| 일기 조회(DiaryView) | `/diary/view` | ✅ 완료 | Router state | DiaryEdit에서 state로 전달 |
| 대시보드(Dashboard) | `/dashboard` | ✅ 완료 | ❌ Mock | 하드코딩 일기 4건 |
| 감정 리포트(Report) | `/report` | ✅ 완료 | ❌ Mock | 하드코딩 통계 수치 |
| 익명 매칭(Match) | `/match` | ✅ 완료 | ❌ Mock | setTimeout으로 매칭 시뮬레이션 |

**전체 유저 플로우(프로토타입 기준)는 동작합니다.**  
Chat → DiaryEdit → DiaryView → Match 순서로 네비게이션이 연결되어 있습니다.

---

## 3. 페이지별 상세 구현 내용

### Home (`/`)
- 그라데이션 히어로 섹션 (블루 계열, 텍스트 + 이미지 레이아웃)
- 이미지 경로: `/image/image3.png` (public 폴더 기준 정적 에셋)
- 주요 기능 4개를 2열 카드 그리드로 소개
- CTA 버튼 → `/chat`으로 이동

### Login (`/login`)
- 로그인 / 회원가입 탭 전환 UI (이메일, 비밀번호, 닉네임 입력)
- `form onSubmit`이 `e.preventDefault()`만 처리하고 실제 인증 로직 없음
- **브랜딩 이슈**: 타이틀이 "EchoDiary"로 표기됨 (서비스명 "Blendy Day"와 불일치)

### Chat (`/chat`)
- 채팅 UI: AI 말풍선(좌) / 사용자 말풍선(우) 레이아웃
- 첫 메시지: "오늘 하루 어땠어? 편하게 말해줘 😊" (하드코딩)
- AI 응답: `MOCK_REPLIES` 배열에서 랜덤 선택 (실제 API 미연결)
- Enter 키 전송 지원
- "일기 완성하기" 버튼 → `/diary/edit`으로 이동 (대화 내용은 전달되지 않음)

### DiaryEdit (`/diary/edit`)
- `MOCK_DRAFT`: 하드코딩된 일기 초안 텍스트 (textarea로 자유 편집 가능)
- `MOCK_TAGS`: `['#회사생활', '#작은성취', '#혼밥', '#오랜친구']` (수정 불가, 표시만)
- 감정 스티커 선택: 행복 / 그럭저럭 / 슬픔 3종 (미선택 시 발행 불가)
- "일기 발행하기" → 편집된 content, 태그, 감정, 날짜를 React Router state로 `/diary/view`에 전달

### DiaryView (`/diary/view`)
- DiaryEdit에서 전달받은 Router state를 렌더링
- state가 없으면(직접 URL 접근 시) `/dashboard`로 redirect
- "랜덤 매칭하기" 버튼: 잔여 횟수 3회, 클릭 시 `/match`로 이동 (횟수는 새로고침 시 초기화)
- "다시 수정하기" → 뒤로가기

### Dashboard (`/dashboard`)
- `MOCK_DIARIES`: 4건의 하드코딩 일기 (2026년 3월 26~29일)
- 주간 달력 뷰: ◀ ▶로 주 이동, 각 요일 칸에 감정 이모지 표시
- 탭 필터: ALL / 😊(행복) / 😢(슬픔+그럭저럭)
- 일기 카드 클릭 → `/diary/view`로 이동 (state 전달)
- 주간 기준 날짜가 `new Date(2026, 2, 31)`로 하드코딩되어 있어 현재 날짜와 무관하게 동작

### Report (`/report`)
- 감정 흐름 바 차트: 행복 14일 / 그럭저럭 9일 / 슬픔 7일 (하드코딩)
- 인사이트 카드 4종: 가장 힘든 요일, 행복한 상황 등 (하드코딩)
- 자주 쓴 해시태그 상위 6개 + 상대 빈도 바 차트 (하드코딩)
- 실제 일기 데이터 기반 분석 로직 없음

### Match (`/match`)
- **idle 상태**: 오늘 일기 태그 표시 + 태그 편집 기능, 매칭 상대 필터 설정
  - 성별 필터: 상관없음 / 여성 / 남성
  - 나이 필터: 듀얼 range 슬라이더 (15~65세, 5세 단위 눈금)
  - 감정 필터: 3종 + 상관없음
- **searching 상태**: 2초 setTimeout 후 자동 매칭 완료 처리
- **found 상태**: 익명 채팅 UI, 상대방 자동 응답(setTimeout 1초)으로 시뮬레이션

---

## 4. 공통 컴포넌트

### Layout (`src/components/Layout.jsx`)
- 상단 sticky 네비게이션: Blendy Day 로고 + 주요 4개 메뉴 + 로그인 버튼
- NavLink의 `isActive`로 현재 페이지 탭 하이라이트
- 하단 푸터: **"EchoDiary"로 표기됨** (브랜딩 불일치)
- `<Outlet />`으로 페이지 렌더링

### 감정 상수 (`src/constants/emotions.js`)
- `happy` / `soSo` / `sad` 3종 정의
- 각 감정별 emoji, label, Tailwind 색상 클래스(배경, 테두리, 바 색상 등) 포함
- 전 페이지에서 공통 참조

---

## 5. 발견된 이슈

| 구분 | 내용 |
|---|---|
| 브랜딩 불일치 | `Login.jsx` 타이틀, `Layout.jsx` 푸터가 "EchoDiary"로 표기됨 (서비스명은 "Blendy Day") |
| 날짜 하드코딩 | `Dashboard.jsx`의 기준 날짜가 `new Date(2026, 2, 31)`로 고정 |
| 대화→일기 미연결 | Chat에서 나눈 대화 내용이 DiaryEdit으로 전달되지 않음 |
| 매칭 횟수 휘발 | DiaryView의 랜덤 매칭 잔여 횟수가 컴포넌트 state로만 관리되어 새로고침 시 초기화 |
| 인증 없는 라우팅 | 로그인 없이 모든 페이지 접근 가능 (보호 라우트 미구현) |

---

## 6. 디자인 시스템

**컬러 팔레트** (Tailwind config 미분리, 인라인 하드코딩 위주)

| 역할 | 색상 코드 |
|---|---|
| Primary (메인 블루그레이) | `#7895B2` |
| 배경 (웜 화이트) | `#F9F8F6` |
| 텍스트 (다크) | `#1e1a16` |
| 서브 텍스트 | `#9b948c` |
| 경계선 | `#E8E6E0` |

**감정 스티커 컬러**

| 감정 | 배경 | 테두리 |
|---|---|---|
| 행복 😊 | `#fdf6e0` | `#f0c05a` |
| 그럭저럭 😑 | `#f0f4f8` | `#7895B2` |
| 슬픔 😢 | `#edf1f9` | `#a0b4d0` |

> 현재 컬러값이 각 컴포넌트에 분산 하드코딩되어 있습니다. Tailwind theme 설정이나 CSS 변수로 중앙화되어 있지 않습니다.

---

## 7. 프로젝트 구조

```
src/
├── components/
│   └── Layout.jsx          # 공통 헤더/푸터/네비게이션
├── constants/
│   └── emotions.js         # 감정 스티커 상수
├── pages/
│   ├── Home.jsx
│   ├── Login.jsx
│   ├── Chat.jsx
│   ├── DiaryEdit.jsx
│   ├── DiaryView.jsx
│   ├── Dashboard.jsx
│   ├── Report.jsx
│   └── Match.jsx
├── assets/
│   └── hero-image.png      # 미사용 (실제로는 /image/image3.png 참조)
├── App.jsx                 # 라우팅 설정
├── App.css
├── index.css
└── main.jsx
```

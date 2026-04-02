# Blendy Day — 프로젝트 개발 보고서

> **해커톤 제출물** | 개발 기간: 1주일 | 스택: React 19 · Vite · Tailwind CSS v4 · React Router v7

---

## 1. 프로젝트 개요

### 1.1 문제 정의

현대인은 일상 속 감정을 기록하고 싶어 하지만, "빈 페이지 앞의 막막함(blank page anxiety)"이 일기 작성의 가장 큰 진입 장벽이 된다. 기존 일기 앱은 **입력의 주도권을 온전히 사용자에게 전가**하기 때문에, 꾸준한 사용으로 이어지기 어렵다.

### 1.2 솔루션

**Blendy Day**는 AI와의 자연어 대화를 1차 입력으로 삼고, 이를 구조화된 일기 초안으로 자동 변환하는 감정 기록 플랫폼이다. 핵심 가치 제안은 세 가지다.

| 가치 | 설명 |
|------|------|
| **마찰 제거** | 타이핑 대신 대화 → 일기 초안 자동 생성 |
| **감정 가시화** | 30일 감정 흐름 리포트 및 해시태그 패턴 분석 |
| **공감 연결** | 비슷한 감정 태그를 가진 익명 사용자와의 매칭 |

### 1.3 기술 스택

```
Frontend  : React 19 (Vite 6)
Styling   : Tailwind CSS v4 (@theme CSS variables)
Routing   : React Router v7 (Outlet 기반 중첩 레이아웃)
Font      : Nanum Myeongjo (나눔명조) — 일기장 감성 의도
State     : useState / useRef / useEffect (로컬 상태 관리)
```

---

## 2. 아키텍처 설계

### 2.1 라우팅 구조

단일 `Layout` 컴포넌트가 헤더와 푸터를 소유하고, `<Outlet />`을 통해 페이지 컴포넌트를 렌더링하는 **중첩 라우트 패턴**을 채택했다. 이를 통해 네비게이션 상태를 중앙에서 관리하면서 각 페이지는 독립적으로 개발할 수 있었다.

```
/               → Home
/chat           → Chat (AI 대화)
/diary/edit     → DiaryEdit (초안 편집)
/diary/view     → DiaryView (완성 일기 열람)
/dashboard      → Dashboard (일기 목록)
/report         → Report (감정 리포트)
/match          → Match (익명 매칭)
```

페이지 간 데이터 전달은 React Router v7의 **`navigate(path, { state })`** 패턴으로 처리했다. URL 파라미터 대신 네비게이션 state를 사용함으로써 민감한 일기 내용이 URL에 노출되지 않도록 설계했다.

```js
// DiaryEdit.jsx — 일기 발행 시 state로 데이터 전달
navigate('/diary/view', {
  state: { content, tags: MOCK_TAGS, mood: selectedSticker, date: ... }
})

// DiaryView.jsx — state 부재 시 리다이렉트로 직접 접근 방어
const { state } = useLocation()
if (!state) { navigate('/dashboard', { replace: true }); return null }
```

### 2.2 공유 상수 모듈 (`src/constants/emotions.js`)

감정 데이터(이모지, 레이블, 색상 토큰)를 **단일 진실 공급원(Single Source of Truth)**으로 분리했다. 초기 개발 시 각 페이지(DiaryEdit, Dashboard, Report, Match)가 독립적으로 감정 정보를 하드코딩했기 때문에, 감정 카테고리를 수정할 때마다 4개 파일을 동시에 수정해야 하는 **산탄총 수술(Shotgun Surgery) 문제**가 발생했다.

```js
// src/constants/emotions.js
export const EMOTIONS = {
  happy: { id: 'happy', emoji: '😊', label: '행복',
           color: '...', barColor: '...', legendColor: '...' },
  soSo:  { id: 'soSo',  emoji: '😑', label: '그럭저럭', ... },
  sad:   { id: 'sad',   emoji: '😢', label: '슬픔', ... },
}
```

이 리팩토링 이후 감정 추가/변경 시 단 하나의 파일만 수정하면 되며, 모든 페이지에 즉시 반영된다.

### 2.3 디자인 토큰 시스템 (Tailwind v4 `@theme`)

Tailwind v4의 `@theme` 블록을 활용해 색상·폰트를 CSS 커스텀 프로퍼티로 정의했다. 이를 통해 `text-primary`, `border-border`, `text-heading` 등의 시맨틱 클래스를 전역 사용할 수 있으며, 다크모드 대응 역시 `@media (prefers-color-scheme: dark)` 한 곳에서 관리된다.

```css
@theme {
  --color-primary:  #7895B2;
  --color-heading:  #1e1a16;
  --color-muted:    #9b948c;
  --color-border:   #E8E6E0;
  --font-sans: 'Nanum Myeongjo', Georgia, serif;
}
```

---

## 3. 핵심 기술 문제 및 해결

### 3.1 듀얼 레인지 슬라이더 구현

**문제:** 매칭 페이지의 나이대 필터는 최솟값·최댓값을 동시에 조절하는 **듀얼 핸들 슬라이더**가 필요했다. HTML 네이티브 `<input type="range">`는 단일 핸들만 지원하므로, 외부 라이브러리 없이 구현해야 했다.

**시도 1 (실패):** 두 개의 `<input type="range">`를 `position: absolute`로 겹쳐 배치했다. 그러나 상단 레이어 input이 하위 input의 모든 포인터 이벤트를 가로채, **왼쪽 핸들(ageMin)이 전혀 동작하지 않는** 버그가 발생했다.

**해결:** CSS `pointer-events` 속성을 계층적으로 제어하는 방식으로 해결했다.

```jsx
// 두 input 모두 기본 pointer-events-none → 트랙 클릭 비활성화
// ::-webkit-slider-thumb 에만 pointer-events-auto → 핸들만 클릭 활성화
className="absolute w-full pointer-events-none appearance-none bg-transparent
  [&::-webkit-slider-thumb]:pointer-events-auto
  [&::-webkit-slider-thumb]:appearance-none
  [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4
  [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white
  [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-primary"
```

Tailwind의 임의 variant(`[&::-webkit-slider-thumb]:`)를 활용해 의사 요소(pseudo-element)에 직접 스타일을 주입함으로써, **외부 라이브러리 없이** 네이티브 input만으로 완전한 듀얼 슬라이더를 구현했다. 선택 구간 시각화는 별도의 `div`를 퍼센트 기반 `left/right` 계산으로 오버레이했다.

```js
// 선택 구간 하이라이트 계산
left:  `${((ageMin - AGE_MIN) / (AGE_MAX - AGE_MIN)) * 100}%`
right: `${100 - ((ageMax - AGE_MIN) / (AGE_MAX - AGE_MIN)) * 100}%`
```

---

### 3.2 폴더 탭 UI — CSS 레이어링 트릭

**문제:** 대시보드의 일기 목록을 감정별로 필터링하는 **폴더형 탭 UI**가 필요했다. 활성 탭이 콘텐츠 박스와 시각적으로 연결되어 보여야 하며, 탭 하단 border가 콘텐츠 박스의 상단 border와 겹쳐 "하나의 개체"처럼 보여야 한다.

**해결:** CSS z-index와 `-mb-px` 기법을 조합했다.

```jsx
// 활성 탭: -mb-px로 1px 아래로 밀어 콘텐츠 박스 border와 겹침
// border-b 색상을 탭 배경색과 동일하게 설정 → border가 지워진 것처럼 보임
// z-10으로 콘텐츠 박스(z-0) 위에 렌더링
isActive
  ? `... rounded-t-xl border relative z-10 -mb-px
     bg-[#fdf5ec] border-[#ecd8bc] border-b-[#fdf5ec]`
  : `... rounded-t-xl border bg-[#f5ebe0]`
```

이 기법은 별도의 DOM 조작 없이 순수 CSS만으로 폴더 탭의 연결 효과를 구현한다.

---

### 3.3 주간 날짜 필터링

**문제:** 대시보드에서 주간 단위로 일기를 필터링할 때, JavaScript `Date` 객체의 **시간 컴포넌트(time component)** 차이로 인해 날짜 비교가 불안정했다.

**해결:** ISO 날짜 문자열(`YYYY-MM-DD`)을 파싱해 `new Date(y, m-1, d)`로 시간 없는 순수 날짜 객체를 생성하고, 월요일 기준 주간 범위를 계산했다.

```js
function toDate(iso) {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)  // 시간 컴포넌트 제거
}

function getWeekRange(offset) {
  const today = new Date(2026, 2, 31)
  const day = today.getDay()
  const monday = new Date(today)
  monday.setDate(today.getDate() - (day === 0 ? 6 : day - 1) + offset * 7)
  // ...
}
```

---

## 4. UX 설계 결정

### 4.1 진입 장벽 최소화 — 페르소나 선택 제거

초기 설계에는 대화 스타일을 선택하는 **페르소나 선택 화면**(공감러 / 조언자 / 친구)이 있었다. 그러나 사용자 흐름 분석 결과, 이 화면이 "글쓰기 시작"이라는 핵심 액션 앞에 불필요한 인지 부하를 추가한다고 판단했다. **Hick의 법칙(선택지 증가 → 반응 시간 증가)**에 따라 해당 화면을 제거하고, 네비게이션에서 '오늘 기록'을 클릭하면 즉시 AI 대화창으로 진입하도록 변경했다.

### 4.2 감정 카테고리 단순화

초기에는 다수의 감정 카테고리를 지원했으나, 일기 앱의 핵심 목적인 "오늘의 기분 기록"에는 세밀한 분류보다 **즉각적인 선택 가능성**이 중요하다고 판단했다. 감정을 **행복 / 그럭저럭 / 슬픔** 3가지로 단순화함으로써 DiaryEdit의 스티커 선택, Dashboard의 필터 탭, Report의 통계, Match의 매칭 필터가 모두 동일한 감정 체계를 공유하게 되었다.

### 4.3 일기 발행 플로우 재설계

초기: 일기 발행 → 대시보드(목록) 이동
변경: 일기 발행 → **완성된 일기 상세 화면** 이동

사용자가 방금 완성한 일기를 바로 확인하고 만족감을 얻을 수 있도록 플로우를 수정했다. 이는 **피크-엔드 법칙(Peak-End Rule)**에 따른 결정으로, 경험의 마지막 순간을 긍정적으로 설계하여 재사용 동기를 높인다.

### 4.4 매칭 후 재매칭 횟수 제한 UX

DiaryView에서 '랜덤 매칭하기' 버튼에 **하루 3회 제한** 카운터를 배지로 표시했다. 이는 단순한 기능 제약이 아니라, 희소성을 시각적으로 드러내어 **매칭 한 번의 가치를 높이는** UX 설계다. 0회 소진 시 버튼이 비활성화되어 명확한 피드백을 제공한다.

```jsx
<span className="text-xs px-2 py-0.5 rounded-full bg-white/20 text-white">
  {matchesLeft}/3
</span>
```

### 4.5 시각적 계층 구조 — Shadow-based Depth System

모든 콘텐츠 카드에 `border` 대신 `shadow-xl`을 적용하여 **물리적 깊이감(depth)**을 표현했다. border 기반 UI가 평면적인 컨테이너 구분에 그치는 반면, shadow 기반 UI는 카드가 배경에서 **부유하는 느낌**을 줘 콘텐츠 위계를 직관적으로 전달한다. 이는 Google Material Design의 **elevation 시스템**과 유사한 접근이다.

### 4.6 랜딩 페이지 히어로 — 그라데이션 오버레이

히어로 섹션과 피처 카드 섹션 사이의 경계를 `overflow: hidden`으로 단절하는 대신, 하단에 `transparent → white` 그라데이션 오버레이 레이어를 추가하여 두 섹션이 자연스럽게 **블렌딩(blending)**되도록 했다. 이는 앱 이름 "Blendy"의 정체성과도 부합하는 디자인 결정이다.

```jsx
<div className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none"
     style={{ background: 'linear-gradient(to bottom, transparent, #ffffff)' }} />
```

---

## 5. 페이지별 기능 요약

| 페이지 | 핵심 기능 | 기술적 특이점 |
|--------|-----------|--------------|
| **Home** | 서비스 소개, CTA | CSS gradient text, hero fade overlay |
| **Chat** | AI 대화 인터페이스 | `useRef` + `scrollIntoView` 자동 스크롤 |
| **DiaryEdit** | 초안 편집, 감정 스티커 선택 | navigate state 전달 |
| **DiaryView** | 완성 일기 열람 | location.state guard, 매칭 진입점 |
| **Dashboard** | 주간 일기 목록, 감정 필터 | 폴더 탭 UI, 주간 이모지 바, 날짜 네비게이터 |
| **Report** | 30일 감정 통계 | 수평 progress bar, 해시태그 빈도 분석 |
| **Match** | 익명 매칭, 채팅 | 듀얼 레인지 슬라이더, 5단위 tick, 인라인 태그 편집 |

---

## 6. 향후 개발 계획

1. **백엔드 연동** — AI 대화 처리를 Claude API로 실제 구현, 일기 데이터 영속성 확보 (PostgreSQL + Supabase)
2. **실시간 매칭** — WebSocket 기반 실시간 매칭 큐 구현
3. **페르소나 시스템 복원** — 사용자 데이터 축적 후 감정 패턴 기반 AI 톤 자동 조정
4. **접근성** — WCAG 2.1 AA 수준 달성 (키보드 내비게이션, ARIA 레이블 추가)
5. **PWA 전환** — 서비스 워커 캐싱으로 오프라인 일기 작성 지원

---

## 7. 회고

1주일이라는 짧은 개발 기간 안에서 가장 크게 배운 점은 **"무엇을 만들지 않을 것인가"를 결정하는 것이 "무엇을 만들 것인가"만큼 중요하다**는 사실이다. 페르소나 선택 화면 제거, 감정 카테고리 단순화처럼 기능을 줄이는 결정이 결과적으로 더 응집력 있는 UX로 이어졌다.

기술적으로는 외부 라이브러리 의존 없이 CSS pseudo-element 제어와 pointer-events 레이어링만으로 듀얼 슬라이더를 구현한 경험이 가장 인상적이었다. 문제를 라이브러리로 우회하지 않고 브라우저 렌더링 모델을 이해한 위에서 해결했다는 점에서 실질적인 기술 역량이 성장했다고 생각한다.

---

*보고서 작성일: 2026년 3월 31일*
*개발자: Blendy Day Team*

# backoffice-front 코드 리뷰 보고서

> 리뷰어: Reviewer Agent | 날짜: 2026-04-15 | 대상 브랜치: 로컬 소스 전체

---

## 1. 개요

보듬 서비스의 React/Vite/TypeScript 기반 관리자 백오피스 프론트엔드.  
회원 관리, 이벤트/공지사항 CRUD, 관리자 액션 로그 조회 기능을 제공한다.  
토큰 기반 인증(JWT Access + Refresh)을 메모리 보관 방식으로 구현했으며 Vercel 배포를 타깃으로 한다.

---

## 2. 기술 스택

| 항목 | 버전 |
|---|---|
| React | 19.1.0 |
| react-router | 7.7.0 |
| TypeScript | 6.0.2 |
| Vite | 7.0.4 |
| ESLint | 9.30.1 |
| 배포 플랫폼 | Vercel |
| 테스트 프레임워크 | 없음 |
| 상태관리 라이브러리 | 없음 (Context API만 사용) |

---

## 3. 프로젝트 구조

```
src/
  api/          # fetch 래퍼 + 도메인별 API 모듈
  components/
    common/     # 재사용 UI 컴포넌트
    layout/     # AdminLayout, Header, Sidebar
  context/      # AuthContext, ToastContext
  hooks/        # useAuth, useToast, useVersionCheck
  pages/        # 페이지 컴포넌트 (도메인별 서브디렉토리)
  routes/       # PrivateRoute
  types/        # 도메인 타입 정의
  utils/        # format, queryString
```

레이어 구분이 명확하다. `api/` 모듈이 직접 타입을 사용하고 페이지가 API를 직접 호출하는 단순 구조로 백오피스 규모에 적합하다.

---

## 4. 강점

1. **보안 - 토큰 메모리 보관**: `src/api/client.ts:3-5` — accessToken/refreshToken을 모두 모듈 변수(메모리)로만 관리. localStorage/sessionStorage/cookie 미사용으로 XSS 탈취 불가.
2. **토큰 갱신 경쟁 방지**: `client.ts:107-115` — `isRefreshing` 플래그와 `refreshPromise` 공유로 복수 401 응답 시 중복 refresh 요청 방지.
3. **TS strict 모드 완전 활성화**: `tsconfig.app.json:14-17` — `strict`, `noUnusedLocals`, `noUnusedParameters`, `noFallthroughCasesInSwitch` 모두 활성.
4. **자동 토큰 갱신 스케줄링**: `AuthContext.tsx:38-53` — 만료 5분 전 사전 갱신으로 사용 중 세션 끊김 방지.
5. **XSS 방어**: `dangerouslySetInnerHTML`/`innerHTML` 미사용 확인. 렌더링되는 데이터가 모두 텍스트 노드로 처리됨.
6. **타입 안전성**: `any` 타입 미사용, 모든 API 응답에 제네릭 타입 명시.
7. **버전 체크**: `useVersionCheck.ts` — 60초 폴링 + 탭 가시성 변경 시 체크로 배포 후 클라이언트 stale 방지.
8. **쿼리스트링 유틸**: `queryString.ts` — undefined/빈값 자동 제거로 API 파라미터 오염 방지.

---

## 5. 이슈 (심각도별)

### CRITICAL

#### C-01: CSS 파일 누락 — 빌드 실패
- **위치**: `src/main.tsx:7-9`, `src/pages/LoginPage.tsx:5`, 기타 모든 페이지
- **내용**: `@/styles/base.css`, `@/styles/layout.css`, `@/styles/common.css` 및 각 페이지 CSS 파일을 import하지만 `src/styles/` 디렉토리 자체가 존재하지 않는다. Vite 빌드 시 모듈 해석 실패로 빌드가 중단된다.
- **조치**: `src/styles/` 디렉토리와 해당 CSS 파일들을 생성하거나, CSS 모듈/Tailwind 등 대체 방식으로 교체해야 한다.

#### C-02: vercel.json에 실제 게이트웨이 URL 미설정
- **위치**: `vercel.json:4`
- **내용**: `"destination": "https://REPLACE_WITH_GATEWAY_PUBLIC_URL/api/:path*"` — 플레이스홀더가 그대로 커밋되어 있어 Vercel 프로덕션 배포 시 모든 API 요청이 실패한다.
- **조치**: 실제 백엔드 게이트웨이 URL로 교체하거나 환경변수로 분리해야 한다.

---

### WARNING

#### W-01: 중복 로그인 모달에 Escape/오버레이 클릭 닫기 없음
- **위치**: `src/components/common/DuplicateLoginModal.tsx:9`
- **내용**: `modal-overlay` div에 `onClick` 핸들러가 없고 Escape 키 이벤트 리스너도 없다. ConfirmModal/FormModal과 달리 키보드 닫기가 불가능하다. 접근성(a11y) 문제.
- **조치**: `useEffect`로 Escape 리스너 추가 또는 기존 ConfirmModal 컴포넌트 재사용 검토.

#### W-02: AuthContext 초기 상태 계산 오류
- **위치**: `src/context/AuthContext.tsx:9,11`
- **내용**: `hasStoredRefresh = !!getRefreshToken()`은 항상 `false`다. `AuthProvider` 마운트 시점에 refreshToken이 메모리에 없으므로(페이지 리로드 후) `isAuthLoading`이 `false`로 시작한다. 이후 `useEffect` 내부에서 `storedRefresh`를 읽어도 동일하게 `null`이므로 자동 재인증이 실행되지 않는다. 리로드 후 무조건 로그인 페이지로 이동하는 구조라면 의도된 동작이지만, 코드 주석("refreshToken이 있으면 accessToken 재발급")과 불일치한다.
- **조치**: refreshToken 영속성 전략을 명확히 결정해야 한다. 리로드 후 재인증이 불필요하면 관련 로직(hasStoredRefresh, isAuthLoading 초기값 분기)을 제거해 혼란을 없애야 한다.

#### W-03: refresh 엔드포인트가 중복 호출됨
- **위치**: `src/api/client.ts:107-115`, `src/api/auth.ts:12-13`
- **내용**: `client.ts`의 `tryRefreshToken()`은 직접 `fetch`를 사용하고, `AuthContext.tsx`는 `authApi.refreshToken()`(→ `post()` → `request()`)을 별도로 사용한다. 두 경로가 독립적으로 존재하여 일관성이 낮고 에러 처리 로직이 분산된다.
- **조치**: `tryRefreshToken()`에서 `authApi.refreshToken()`을 재사용하도록 통합하되, 재귀 방지 처리(`_retry` 로직)가 동작하는지 검증 필요.

#### W-04: UserDetailPage — suspendUser 후 getUser 2회 호출
- **위치**: `src/pages/users/UserDetailPage.tsx:86-91`
- **내용**: 정지 성공 후 `getUser(Number(userId))`를 명시적으로 한 번 더 호출한다. 별도로 문제는 아니지만 상태가 PATCH 응답으로 반환된다면 불필요한 추가 요청이다.
- **조치**: `suspendUser` API가 갱신된 UserDetailResponse를 반환하도록 서버와 협의하거나, 현 구조를 유지하되 주석으로 의도를 명시.

#### W-05: EventFormPage — title의 content textarea에 maxLength 미설정
- **위치**: `src/pages/events/EventFormPage.tsx:121-128`
- **내용**: title은 `maxLength={200}`이 있으나 content textarea에는 없다. 서버 측에 제한이 있다면 클라이언트 사전 검증 누락.
- **조치**: 서버 제약에 맞춰 maxLength 추가.

#### W-06: Pagination 컴포넌트 — totalPages=1일 때 렌더링 안 됨
- **위치**: `src/components/common/Pagination.tsx:12`
- **내용**: `if (totalPages <= 1) return null` — 1페이지만 있을 때 페이지네이션 UI가 완전히 사라진다. 검색 결과가 있어도 몇 건인지 맥락이 사라질 수 있다.
- **조치**: 현재 페이지/총 페이지 정보라도 표시하거나, 0페이지(빈 결과)만 숨기도록 조건 수정 검토.

#### W-07: ActionLogPage — actionType 필터가 자유 입력 텍스트
- **위치**: `src/pages/ActionLogPage.tsx:64-70`
- **내용**: 액션 유형이 열거형(enum)으로 관리되어야 할 값인데 자유 입력 `<input type="text">`로 처리된다. 오타로 인한 빈 결과가 발생할 수 있고 서버 enum과 불일치 위험이 있다.
- **조치**: 서버 ActionType enum 목록을 `<select>`로 바인딩하거나 타입을 정의해 사용.

#### W-08: 모달 컴포넌트 ARIA 속성 누락
- **위치**: `src/components/common/ConfirmModal.tsx:38`, `src/components/common/FormModal.tsx:39`
- **내용**: `modal-overlay`, `modal-content`에 `role="dialog"`, `aria-modal="true"`, `aria-labelledby` 없음. 스크린리더 사용자가 모달 컨텍스트를 인식하지 못한다.
- **조치**: `role="dialog" aria-modal="true" aria-labelledby="modal-title-id"` 추가.

---

### INFO

#### I-01: LoginPage — ERROR_MESSAGES가 렌더마다 재생성됨
- **위치**: `src/pages/LoginPage.tsx:17-21`
- **내용**: `ERROR_MESSAGES` 객체가 컴포넌트 함수 내부에 선언되어 있어 렌더링마다 재생성된다. 상수이므로 컴포넌트 외부 모듈 레벨로 이동해야 한다.
- **조치**: 컴포넌트 밖으로 이동 (`const ERROR_MESSAGES: Record<string, string> = { ... }`).

#### I-02: UserDetailPage — holdings 테이블 key로 idx 사용
- **위치**: `src/pages/users/UserDetailPage.tsx:254`
- **내용**: `key={idx}` — 배열 인덱스를 key로 사용. 보유 종목이 동적으로 변경될 경우 렌더링 최적화 실패 가능.
- **조치**: `key={h.assetCode}` 또는 `key={`${h.assetType}-${h.assetCode}`}` 사용.

#### I-03: App.tsx — PrivateRoute + AdminLayout 중첩 반복
- **위치**: `src/App.tsx:28-37`
- **내용**: 모든 보호 라우트마다 `<PrivateRoute><AdminLayout>...</AdminLayout></PrivateRoute>`가 반복된다. react-router의 중첩 라우트(Outlet) 패턴을 활용하면 선언적으로 간결하게 표현할 수 있다.
- **조치**: Layout Route 패턴으로 리팩토링 검토.

#### I-04: client.ts — BASE_URL이 빈 문자열 하드코딩
- **위치**: `src/api/client.ts:1`
- **내용**: `const BASE_URL = ''` — 로컬에서는 Vite 프록시가 처리하나, 환경별 분리가 필요하면 `import.meta.env.VITE_API_URL` 방식으로 전환 가능. 현재 구조(상대경로 + 프록시/vercel rewrite)는 일관성 있음.

#### I-05: 테스트 코드 전무
- **내용**: `*.test.ts(x)`, `*.spec.ts(x)` 파일이 하나도 없다. 인증 흐름(`tryRefreshToken`, 중복 로그인 감지), 유틸 함수(`formatDate`, `toQueryString`)에 대한 단위 테스트 부재.
- **조치**: Vitest + @testing-library/react 도입 권장.

#### I-06: index.html — lang 속성 미확인
- **내용**: `index.html`의 `<html lang="">` 또는 lang 속성이 설정되지 않은 경우 스크린리더가 언어를 잘못 해석할 수 있다. (`lang="ko"` 권장)

#### I-07: ESLint — TypeScript 타입 정보 활용 규칙 미적용
- **위치**: `eslint.config.js:33-56`
- **내용**: `@typescript-eslint/eslint-plugin`은 로드하지만 `parserOptions.project`가 설정되지 않아 타입 정보 기반 규칙(`@typescript-eslint/no-floating-promises`, `@typescript-eslint/await-thenable` 등)을 적용할 수 없다.
- **조치**: `parserOptions: { project: './tsconfig.app.json' }` 추가 후 typed linting 규칙 활성화.

---

## 6. 개선 제안

### 단기 (버그/빌드 차단)
1. **CSS 파일 생성** (C-01) — `src/styles/` 디렉토리와 누락 파일 생성 없이는 빌드 불가
2. **vercel.json 게이트웨이 URL 교체** (C-02)

### 중기 (안정성/품질)
3. **AuthContext refreshToken 전략 명확화** (W-02) — 리로드 후 재인증 불필요 시 관련 코드 제거
4. **tryRefreshToken 내부 API 통합** (W-03) — `authApi.refreshToken()` 재사용
5. **모달 ARIA 속성 추가** (W-08) — 접근성 표준 준수
6. **DuplicateLoginModal Escape 닫기 추가** (W-01)

### 장기 (유지보수성)
7. **Vitest 테스트 도입** (I-05) — 인증 흐름, 유틸 함수 우선
8. **App.tsx Layout Route 리팩토링** (I-03) — 중첩 라우트 패턴
9. **ESLint typed linting 활성화** (I-07)
10. **ActionType enum 관리** (W-07)

---

## 7. 로컬 실행

```bash
# 의존성 설치
npm install

# 개발 서버 (포트 5174, /api/admin → http://localhost:8083 프록시)
npm run dev

# 빌드 (CSS 파일 생성 후 가능)
npm run build

# 린트
npm run lint
```

**사전 요건**: `src/styles/` 디렉토리 및 CSS 파일이 존재해야 빌드 성공.  
**백엔드 주소**: `vite.config.ts:38` 기준 `http://localhost:8083` (수정 가능).

---

## 8. 빌드 검증 결과

> **상태: 미실행** — Bash 도구 실행 권한이 없어 `npm install && npm run build`를 직접 실행하지 못했습니다.

**예상 빌드 실패 원인 (정적 분석 기반)**:
- `src/styles/base.css`, `src/styles/layout.css`, `src/styles/common.css` 미존재
- `src/styles/pages/login.css`, `dashboard.css`, `users.css`, `events.css`, `notices.css`, `action-logs.css` 미존재
- Vite는 CSS import를 모듈로 처리하므로 파일 없으면 빌드 중단

**빌드 성공을 위해 사용자가 실행해야 할 명령**:
```bash
cd /Users/xabier/IdeaProjects/backoffice-front
npm install && npm run build
```
빌드 성공 여부와 출력 결과를 이 섹션에 추가 기록할 것을 권장합니다.

---

## ✅ 빌드 검증 결과

- **명령**: `npm install && npm run build`
- **결과**: Vite 빌드 성공 (81/79 modules transformed)
- **산출물**: `dist/` (index.html, assets/index-*.js ~270KB, CSS, version.json)
- **경고**: 없음

## 추가 발견 사항 (2026-04-15)

### 적용됨
- W-01: `DuplicateLoginModal` Escape 핸들러 + overlay 클릭 닫기 + role/aria-modal/aria-labelledby 추가
- W-05: `EventFormPage` content textarea `maxLength={5000}` 및 카운터 추가
- W-08: `ConfirmModal`, `FormModal`에 `role="dialog"`, `aria-modal="true"`, `aria-labelledby` 추가
- I-01: `LoginPage` `ERROR_MESSAGES` 상수를 모듈 스코프로 이동
- I-02: `UserDetailPage` holdings 테이블 key를 `assetType-assetCode`로 변경

### 기존 상태 (이미 해결됨)
- C-01: `src/styles/` 디렉토리 및 CSS 존재 확인, 빌드 성공
- I-06: `index.html` `lang="ko"` 설정됨

### 미적용 (파괴적/정책 결정 필요)
- C-02: `vercel.json` 게이트웨이 URL — 실제 프로덕션 URL을 몰라 플레이스홀더 유지
- W-02: AuthContext refreshToken 전략 — 정책 결정 필요
- W-03: tryRefreshToken 통합 — 재귀 방지 테스트 필요
- W-04: suspendUser 후 재조회 — 서버 API 계약 협의 필요
- W-06: Pagination 1페이지 표시 — UX 정책 결정
- W-07: ActionLogPage enum — 서버 enum 목록 필요
- I-03: Layout Route 리팩토링 — 전면 구조 변경
- I-05/I-07: 테스트 도입, typed linting

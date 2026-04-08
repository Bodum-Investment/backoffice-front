# 구현 변경 사항 요약

작성일: 2026-04-08
설계 문서: `01_architect_design.md`

---

## 1. 구현 결과

빌드 성공 (vite build, 697ms)
- 총 42개 파일 생성 (설계서 일치)
- 78 모듈 변환 완료
- dist 출력: index.html + CSS(10.93KB) + JS(270.03KB)

---

## 2. 생성 파일 목록

### 프로젝트 설정 (6개)
- `package.json` — React 19, react-router 7, TypeScript 6, Vite 7
- `vite.config.ts` — proxy /api/admin -> localhost:8083, port 5174
- `tsconfig.json`, `tsconfig.app.json`, `tsconfig.node.json`
- `eslint.config.js` — bodum-front-app 패턴 이식
- `index.html`, `.gitignore`, `src/vite-env.d.ts`

### 타입 정의 (7개)
- `src/types/common.ts` — PageResponse, ApiResponse, 공통 enum
- `src/types/auth.ts` — AdminTokenResponse 등
- `src/types/user.ts` — UserDetailResponse, Portfolio, Holding 등
- `src/types/event.ts` — EventResponse, EventCreateRequest 등
- `src/types/notice.ts` — NoticeResponse 등
- `src/types/actionLog.ts` — AdminActionLogResponse
- `src/types/index.ts` — 배럴 export

### API 레이어 (6개)
- `src/api/client.ts` — bodum-front-app 이식 + put/patch/del 추가, refresh 경로 변경, 204 처리
- `src/api/auth.ts` — login, refreshToken, logout
- `src/api/users.ts` — getUsers, getUser, getUserPortfolio, getUserTrades, suspendUser
- `src/api/events.ts` — CRUD + toQueryString
- `src/api/notices.ts` — CRUD
- `src/api/actionLogs.ts` — getActionLogs

### Context & Hooks (5개)
- `src/context/authContextDef.ts` — AuthContextValue 인터페이스
- `src/context/AuthContext.tsx` — AuthProvider (토큰 관리, 자동 갱신, 중복 로그인)
- `src/context/ToastContext.tsx` — ToastProvider + useToast
- `src/hooks/useAuth.ts`
- `src/hooks/useToast.ts`

### 공통 컴포넌트 (7개)
- `src/components/common/Pagination.tsx` — 0-indexed, 최대 10페이지 표시
- `src/components/common/ConfirmModal.tsx` — ESC 닫기, 배경 스크롤 잠금
- `src/components/common/FormModal.tsx` — 입력 폼 모달
- `src/components/common/Toast.tsx` — 토스트 렌더러
- `src/components/common/StatusBadge.tsx` — 상태값 뱃지
- `src/components/common/LoadingSpinner.tsx` — CSS 스피너
- `src/components/common/DuplicateLoginModal.tsx` — 중복 로그인 안내

### 레이아웃 & 라우팅 (4개)
- `src/components/layout/AdminLayout.tsx`
- `src/components/layout/Sidebar.tsx` — NavLink + active 스타일
- `src/components/layout/Header.tsx` — 로그아웃 버튼
- `src/routes/PrivateRoute.tsx` — 인증 가드

### 페이지 (9개)
- `src/pages/LoginPage.tsx` — 에러 코드 매핑, 인증 시 리다이렉트
- `src/pages/DashboardPage.tsx` — 카드형 링크 허브
- `src/pages/users/UserListPage.tsx` — 검색/필터/URL 동기화/페이징
- `src/pages/users/UserDetailPage.tsx` — 탭(정보/포트폴리오/거래), 정지 모달
- `src/pages/events/EventListPage.tsx` — 상태 필터/페이징
- `src/pages/events/EventFormPage.tsx` — 생성/수정 통합, 날짜 검증, 삭제
- `src/pages/notices/NoticeListPage.tsx` — 페이징
- `src/pages/notices/NoticeFormPage.tsx` — 생성/수정 통합, 토글
- `src/pages/ActionLogPage.tsx` — 필터/페이징, 읽기 전용

### 엔트리 (2개)
- `src/main.tsx` — Provider 래핑
- `src/App.tsx` — 라우팅 정의

### 스타일 (9개)
- `src/styles/base.css` — CSS 변수, 리셋
- `src/styles/layout.css` — 사이드바, 헤더, 레이아웃
- `src/styles/common.css` — 버튼, 폼, 테이블, 모달, 토스트, 뱃지, 페이지네이션, 토글, 탭
- `src/styles/pages/login.css`
- `src/styles/pages/dashboard.css`
- `src/styles/pages/users.css`
- `src/styles/pages/events.css`
- `src/styles/pages/notices.css`
- `src/styles/pages/action-logs.css`

### 유틸리티 (1개)
- `src/utils/format.ts` — 날짜, 숫자, 수익률, 수량 포맷 + 한글 매핑

---

## 3. 설계 문서 대비 차이점

없음. 설계 문서의 모든 파일, 인터페이스, API 경로, 컴포넌트 구조를 그대로 구현함.

---

## 4. 실행 방법

```bash
cd backoffice-front
npm install
npm run dev      # http://localhost:5174
npm run build    # 프로덕션 빌드
```

백엔드(backoffice-core)가 localhost:8083에서 실행 중이어야 API 연동 동작.

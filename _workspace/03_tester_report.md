# 테스트/검증 보고서

작성일: 2026-04-08
검증 대상: backoffice-front
스택: React 19 + TypeScript + Vite

---

## 1. 최종 결론

| 항목 | 결과 |
|------|------|
| 빌드 (npm run build) | PASS |
| Lint (npm run lint) | **FAIL — 1건** |
| 파일 존재 여부 | PASS |
| TypeScript 타입 / backoffice-core DTO 일치 | PASS (단, 주의 사항 1건) |
| API client.ts 인증 흐름 | PASS |
| 라우팅 구조 | PASS |
| vite.config.ts proxy | PASS |

**전체 판정: 조건부 통과** — lint 오류 1건 수정 후 배포 가능.

---

## 2. 빌드 검증

```
> vite build
✓ 78 modules transformed.
dist/index.html                   0.47 kB │ gzip:  0.33 kB
dist/assets/index-DcIPXL_0.css   10.93 kB │ gzip:  2.62 kB
dist/assets/index-MXwAbD75.js   270.03 kB │ gzip: 82.87 kB
✓ built in 719ms
```

**결과: PASS.** TypeScript 컴파일 오류 없음. 설계서 명시 수치(78모듈, CSS 10.93KB, JS 270.03KB)와 100% 일치.

---

## 3. Lint 검증

```
> eslint .

/Users/jinhojeong/Desktop/private/backoffice-front/src/context/ToastContext.tsx
  42:17  error  Fast refresh only works when a file only exports components.
                Use a new file to share constants or functions between components
                react-refresh/only-export-components
✖ 1 problem (1 error, 0 warnings)
```

**결과: FAIL.** 오류 1건.

### 원인 분석

`ToastContext.tsx`가 `ToastProvider` (컴포넌트)와 `useToast` (훅 함수)를 동시에 export하고 있어 react-refresh 규칙 위반이다.

### 수정 방법 (권고)

`useToast`를 `src/hooks/useToast.ts`로 이동시키거나, `ToastContext.tsx`의 `useToast` export를 제거하고 `src/hooks/useToast.ts`에서만 export하도록 분리한다.

현재 `src/hooks/useToast.ts`가 이미 존재하며 `ToastContext.tsx`에서 re-export하는 구조이다. `ToastContext.tsx`의 `useToast` 함수를 제거하고 `src/hooks/useToast.ts`에서 직접 구현하는 것이 올바른 수정이다.

**수정 예시:**

```typescript
// src/hooks/useToast.ts (수정 후)
import { useContext } from 'react';
import { ToastContext } from '@/context/ToastContext';

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within ToastProvider');
  return context;
}
```

```typescript
// src/context/ToastContext.tsx (수정 후)
// useToast export 제거, ToastContext를 export로 변경
export const ToastContext = createContext<ToastContextValue | null>(null);
// ... ToastProvider만 export
```

---

## 4. 파일 존재 여부 검증

설계서 기준 42개 파일 전체 존재 확인.

| 카테고리 | 설계 | 실제 | 결과 |
|---------|------|------|------|
| 프로젝트 설정 | 6개 | 6개 | PASS |
| 타입 정의 (src/types/) | 7개 | 7개 | PASS |
| API 레이어 (src/api/) | 6개 | 6개 | PASS |
| Context & Hooks | 5개 | 5개 | PASS |
| 공통 컴포넌트 (common/) | 7개 | 7개 | PASS |
| 레이아웃 & 라우팅 | 4개 | 4개 | PASS |
| 페이지 (pages/) | 9개 | 9개 | PASS |
| 엔트리 (main.tsx, App.tsx) | 2개 | 2개 | PASS |
| 스타일 (styles/) | 9개 | 9개 | PASS |
| 유틸리티 (utils/) | 1개 | 1개 | PASS |

---

## 5. TypeScript 타입 / backoffice-core DTO 일치 검증

### 5-1. AdminTokenResponse

| 필드 | backoffice-core (Kotlin) | backoffice-front (TS) | 일치 |
|------|--------------------------|----------------------|------|
| accessToken | String | string | PASS |
| refreshToken | String | string | PASS |
| expiresIn | **Long** | **number** | PASS (JSON 직렬화 시 number로 호환) |

### 5-2. AdminLoginRequest / AdminRefreshRequest

| 필드 | backoffice-core | backoffice-front | 일치 |
|------|-----------------|-----------------|------|
| AdminLoginRequest.email | String | string | PASS |
| AdminLoginRequest.password | String | string | PASS |
| AdminRefreshRequest.refreshToken | String | string | PASS |

### 5-3. UserListResponse

| 필드 | backoffice-core | backoffice-front | 일치 |
|------|-----------------|-----------------|------|
| id | Long | number | PASS |
| email | String | string | PASS |
| nickname | String | string | PASS |
| role | String | string | PASS |
| status | String | UserStatus (string union) | PASS |
| createdAt | Instant | string | PASS (ISO 8601 직렬화) |

### 5-4. UserDetailResponse

| 필드 | backoffice-core | backoffice-front | 일치 |
|------|-----------------|-----------------|------|
| id | Long | number | PASS |
| profileImageUrl | String? | string \| null | PASS |
| status | String | UserStatus | PASS |
| createdAt, updatedAt | Instant | string | PASS |

### 5-5. UserPortfolioResponse / Portfolio / Holding / Wallet

backoffice-core의 실제 구현체는 `TradeCoreClient.PortfolioDto`, `TradeCoreClient.WalletDto`이다. 각 필드를 대조한 결과:

| 항목 | backoffice-core (TradeCoreClient) | backoffice-front | 일치 |
|------|-----------------------------------|-----------------|------|
| PortfolioDto.balance | BigDecimal | number | PASS |
| PortfolioDto.holdings | List\<HoldingDto\> | Holding[] | PASS |
| HoldingDto.quantity | BigDecimal | number | PASS |
| HoldingDto.profitRate | BigDecimal | number | PASS |
| WalletDto.totalReturnRate | BigDecimal | number | PASS |

**주의:** `BigDecimal`은 JSON 직렬화 시 number로 변환되므로 정밀도 손실이 발생할 수 있다. 표시 목적으로는 문제없으나, 백엔드가 매우 큰 금액을 다룰 경우 JS number 정밀도 한계(Number.MAX_SAFE_INTEGER)를 고려해야 한다. 현재 기능 범위(포트폴리오 조회/표시)에서는 실용상 문제없음.

### 5-6. UserTradeHistoryResponse

backoffice-core의 `TradeHistoryDto` 모든 필드가 `src/types/user.ts`의 `UserTradeHistoryResponse`와 일치. tradedAt은 `Instant?` → `string | null`로 올바르게 매핑.

### 5-7. EventResponse / EventCreateRequest / EventUpdateRequest

| 필드 | backoffice-core | backoffice-front | 일치 |
|------|-----------------|-----------------|------|
| startAt, endAt | Instant | string | PASS |
| status | EventStatus(enum) | EventStatus(string union) | PASS |
| isActive | Boolean | boolean | PASS |

### 5-8. NoticeResponse / NoticeCreateRequest / NoticeUpdateRequest

| 필드 | backoffice-core | backoffice-front | 일치 |
|------|-----------------|-----------------|------|
| isPublished | Boolean | boolean | PASS |
| isPinned | Boolean | boolean | PASS |

### 5-9. AdminActionLogResponse

| 필드 | backoffice-core | backoffice-front | 일치 |
|------|-----------------|-----------------|------|
| id | Long | number | PASS |
| adminUserId | Long | number | PASS |
| targetId | Long | number | PASS |
| detail | String? | string \| null | PASS |

### 5-10. PageResponse

| 필드 | backoffice-core | backoffice-front | 일치 |
|------|-----------------|-----------------|------|
| content | List\<T\> | T[] | PASS |
| page | Int | number | PASS |
| size | Int | number | PASS |
| totalElements | **Long** | **number** | PASS (JSON 직렬화 호환, 주의사항 동일) |
| totalPages | Int | number | PASS |

---

## 6. API client.ts 인증 흐름 검증

설계서 4-1 흐름도 대비 실제 구현 대조.

| 시나리오 | 설계 | 구현 | 결과 |
|---------|------|------|------|
| 401 + DUPLICATE_LOGIN | CustomEvent('duplicate-login') dispatch → 토큰 삭제 | `window.dispatchEvent(new CustomEvent('duplicate-login'))` + `setAccessToken(null)` + `localStorage.removeItem('refreshToken')` | PASS |
| 401 + refresh 엔드포인트 자체 오류 | clearAuthAndDispatch() | `path.includes('/api/admin/auth/refresh')` 체크 후 `clearAuthAndDispatch()` | PASS |
| 401 + 이미 재시도 | clearAuthAndDispatch() | `_retry === true` 체크 후 `clearAuthAndDispatch()` | PASS |
| 일반 401 | refresh 시도 → 성공 시 재요청, 실패 시 clearAuthAndDispatch() | `isRefreshing` 플래그로 중복 refresh 방지 후 재시도 | PASS |
| 204 No Content | undefined 반환 | `response.status === 204` → `return undefined as T` | PASS |
| auth-expired 이벤트 | AuthContext에서 clearAuth() 호출 | `window.addEventListener('auth-expired', handleAuthExpired)` → `clearAuth()` | PASS |
| 토큰 자동 갱신 | setTimeout((expiresIn-300)*1000, 최소 10초) | `Math.max((expiresInSeconds - 300) * 1000, 10000)` | PASS |
| refresh 경로 | /api/admin/auth/refresh | `BASE_URL + '/api/admin/auth/refresh'` | PASS |

---

## 7. 라우팅 구조 검증

설계서 기준 라우트 전체 대조.

| 경로 | 설계 | 구현 | 인증 가드 | 결과 |
|------|------|------|----------|------|
| /login | LoginPage | LoginPage | 없음 (공개) | PASS |
| / | DashboardPage | DashboardPage | PrivateRoute | PASS |
| /users | UserListPage | UserListPage | PrivateRoute | PASS |
| /users/:userId | UserDetailPage | UserDetailPage | PrivateRoute | PASS |
| /events | EventListPage | EventListPage | PrivateRoute | PASS |
| /events/new | EventFormPage | EventFormPage | PrivateRoute | PASS |
| /events/:eventId | EventFormPage | EventFormPage | PrivateRoute | PASS |
| /notices | NoticeListPage | NoticeListPage | PrivateRoute | PASS |
| /notices/new | NoticeFormPage | NoticeFormPage | PrivateRoute | PASS |
| /notices/:noticeId | NoticeFormPage | NoticeFormPage | PrivateRoute | PASS |
| /action-logs | ActionLogPage | ActionLogPage | PrivateRoute | PASS |
| * | Navigate to / | Navigate to / replace | — | PASS |

PrivateRoute는 `useAuth().isAuthenticated`가 false이면 `/login`으로 `replace` redirect. 설계 일치.

---

## 8. vite.config.ts proxy 검증

```typescript
proxy: {
  '/api/admin': {
    target: 'http://localhost:8083',
    changeOrigin: true,
  },
},
```

| 항목 | 설계 | 구현 | 결과 |
|------|------|------|------|
| proxy 경로 | /api/admin | /api/admin | PASS |
| target | localhost:8083 | localhost:8083 | PASS |
| changeOrigin | true | true | PASS |
| dev port | 5174 | 5174 | PASS |
| @ alias | src/ | path.resolve(__dirname, './src') | PASS |

---

## 9. 발견된 문제 목록

| 번호 | 심각도 | 위치 | 내용 | 수정 필요 여부 |
|------|--------|------|------|--------------|
| 1 | **ERROR** | src/context/ToastContext.tsx:42 | `useToast` 함수와 `ToastProvider` 컴포넌트를 같은 파일에서 export → react-refresh 규칙 위반 | **필수** (lint 통과 위해) |
| 2 | 주의 | src/types/user.ts, common.ts | `BigDecimal` → `number` 매핑: JS number 정밀도 한계로 인한 잠재적 정밀도 손실 (현 기능 범위에서는 실용상 무해) | 선택 (모니터링 권고) |

---

## 10. 종합 의견

빌드는 완벽하게 성공하며 TypeScript 컴파일 오류가 없다. 설계서에 명시된 모든 파일이 존재하고, backoffice-core DTO와의 타입 매핑도 올바르다. 인증 흐름(refresh, 중복 로그인, auth-expired)과 라우팅 구조, proxy 설정 모두 설계와 일치한다.

유일한 문제는 `ToastContext.tsx`의 lint 오류 1건이며, `useToast`를 `src/hooks/useToast.ts`에서 직접 구현하도록 분리하면 즉시 해결된다. 수정 공수는 10분 미만이며 기능에는 영향이 없다.

# backoffice-front 아키텍처 설계서

작성일: 2026-04-08
입력 문서: `00_planner_spec.md`, `00_analyst_as_is.md`
참조 코드: `bodum-front-app/src/`

---

## 1. 프로젝트 구조 (전체 파일 트리)

```
src/
├── main.tsx                          # ReactDOM 엔트리포인트
├── App.tsx                           # 라우팅 정의, AuthProvider/ToastProvider 래핑
├── vite-env.d.ts                     # Vite 타입 선언
│
├── api/                              # API 호출 함수 (도메인별 분리)
│   ├── client.ts                     # fetch 래퍼, accessToken 메모리 보관, 401 자동 refresh 재시도
│   ├── auth.ts                       # login, refreshToken, logout
│   ├── users.ts                      # getUsers, getUser, getUserPortfolio, getUserTrades, suspendUser
│   ├── events.ts                     # getEvents, getEvent, createEvent, updateEvent, deleteEvent
│   ├── notices.ts                    # getNotices, getNotice, createNotice, updateNotice, deleteNotice
│   └── actionLogs.ts                 # getActionLogs
│
├── components/
│   ├── layout/
│   │   ├── AdminLayout.tsx           # 전체 레이아웃 래퍼 (Sidebar + Header + content)
│   │   ├── Sidebar.tsx               # 좌측 사이드바 네비게이션
│   │   └── Header.tsx                # 상단 헤더 (로그아웃 버튼)
│   └── common/
│       ├── Pagination.tsx            # 페이지네이션 (0-indexed, 최대 10페이지 표시)
│       ├── ConfirmModal.tsx           # 삭제 확인용 모달
│       ├── FormModal.tsx             # 입력 폼 모달 (회원 정지 사유 등)
│       ├── Toast.tsx                 # 토스트 알림 렌더러
│       ├── LoadingSpinner.tsx        # 로딩 스피너 (bodum-front-app 이식)
│       ├── DuplicateLoginModal.tsx   # 중복 로그인 모달 (bodum-front-app 이식)
│       └── StatusBadge.tsx           # 상태값 뱃지 (ACTIVE/SUSPENDED/DELETED 등)
│
├── context/
│   ├── AuthContext.tsx               # AuthProvider 구현체 (로그인/로그아웃/토큰 관리)
│   ├── authContextDef.ts            # AuthContextValue 인터페이스 + createContext
│   └── ToastContext.tsx              # ToastProvider 구현체 + useToast 훅
│
├── hooks/
│   ├── useAuth.ts                    # AuthContext 소비 훅
│   └── useToast.ts                   # ToastContext 소비 훅
│
├── pages/
│   ├── LoginPage.tsx                 # 로그인 폼 (공개 라우트)
│   ├── DashboardPage.tsx             # 대시보드 (링크 허브)
│   ├── users/
│   │   ├── UserListPage.tsx          # 회원 목록 (검색/필터/페이징)
│   │   └── UserDetailPage.tsx        # 회원 상세 (탭: 정보/포트폴리오/거래내역)
│   ├── events/
│   │   ├── EventListPage.tsx         # 이벤트 목록 (상태 필터/페이징)
│   │   └── EventFormPage.tsx         # 이벤트 생성/수정 통합 폼
│   ├── notices/
│   │   ├── NoticeListPage.tsx        # 공지사항 목록 (페이징)
│   │   └── NoticeFormPage.tsx        # 공지사항 생성/수정 통합 폼
│   └── ActionLogPage.tsx             # 관리자 액션 로그 (읽기 전용)
│
├── routes/
│   └── PrivateRoute.tsx              # 인증 가드 컴포넌트
│
├── styles/
│   ├── base.css                      # CSS 변수, 리셋, 타이포그래피
│   ├── layout.css                    # AdminLayout, Sidebar, Header 스타일
│   ├── common.css                    # 공통 컴포넌트 (버튼, 테이블, 모달, 토스트, 폼, 뱃지) 스타일
│   └── pages/
│       ├── login.css                 # 로그인 페이지 고유 스타일
│       ├── dashboard.css             # 대시보드 카드 레이아웃
│       ├── users.css                 # 회원 목록/상세/포트폴리오/거래내역
│       ├── events.css                # 이벤트 목록/폼
│       ├── notices.css               # 공지사항 목록/폼
│       └── action-logs.css           # 액션 로그 목록
│
├── types/
│   ├── auth.ts                       # AdminLoginRequest, AdminRefreshRequest, AdminTokenResponse
│   ├── user.ts                       # UserListResponse, UserDetailResponse, UserPortfolioResponse, UserTradeHistoryResponse, UserSuspendRequest
│   ├── event.ts                      # EventResponse, EventCreateRequest, EventUpdateRequest
│   ├── notice.ts                     # NoticeResponse, NoticeCreateRequest, NoticeUpdateRequest
│   ├── actionLog.ts                  # AdminActionLogResponse
│   ├── common.ts                     # PageResponse<T>, ApiResponse<T>, 공통 enum 타입
│   └── index.ts                      # 배럴 export
│
└── utils/
    └── format.ts                     # 날짜 포맷, 숫자 포맷, 한글 변환 유틸
```

총 파일 수: 42개

---

## 2. 라이브러리 선정

| 라이브러리 | 버전 | 용도 | 선정 근거 |
|-----------|------|------|----------|
| react | ^19.1.0 | UI 프레임워크 | bodum-front-app 동일 |
| react-dom | ^19.1.0 | DOM 렌더링 | bodum-front-app 동일 |
| react-router | ^7.7.0 | 라우팅 | bodum-front-app 동일 |
| vite | ^7.0.4 | 빌드 도구 | bodum-front-app 동일 |
| @vitejs/plugin-react | ^4.6.0 | Vite React 플러그인 | bodum-front-app 동일 |
| typescript | ^6.0.2 | 타입 시스템 | bodum-front-app 동일 |

**추가 라이브러리 없음.** 날짜 입력은 브라우저 네이티브 `<input type="datetime-local" />`을 사용하여 외부 라이브러리 없이 처리한다. 날짜 포맷팅은 `Date` 내장 객체로 `utils/format.ts`에서 처리한다.

### package.json

```json
{
  "name": "backoffice-front",
  "private": true,
  "version": "0.0.1",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "lint": "eslint .",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^19.1.0",
    "react-dom": "^19.1.0",
    "react-router": "^7.7.0"
  },
  "devDependencies": {
    "@eslint/js": "^9.30.1",
    "@types/react": "^19.1.8",
    "@types/react-dom": "^19.1.6",
    "@typescript-eslint/eslint-plugin": "^8.58.0",
    "@typescript-eslint/parser": "^8.58.0",
    "@vitejs/plugin-react": "^4.6.0",
    "eslint": "^9.30.1",
    "eslint-plugin-react-hooks": "^5.2.0",
    "eslint-plugin-react-refresh": "^0.4.20",
    "globals": "^16.3.0",
    "typescript": "^6.0.2",
    "vite": "^7.0.4"
  }
}
```

---

## 3. API 클라이언트 설계

### 3-1. client.ts (bodum-front-app 이식 + backoffice-core 경로 적응)

bodum-front-app의 `client.ts`를 기반으로 하되, 다음을 변경한다.

**변경점:**
- refresh 엔드포인트: `/api/auth/refresh` -> `/api/admin/auth/refresh`
- `put`, `patch`, `del` 메서드 추가 (공지사항/이벤트 CRUD, 회원 정지에 필요)
- `del` 메서드에서 204 No Content 처리 (json 파싱 건너뛰기)

```typescript
// src/api/client.ts

const BASE_URL = '';

// accessToken은 메모리에만 보관 (XSS 방어)
let accessToken: string | null = null;

export function setAccessToken(token: string | null): void {
  accessToken = token;
}

export function getAccessToken(): string | null {
  return accessToken;
}

let isRefreshing = false;
let refreshPromise: Promise<string | null> | null = null;

async function tryRefreshToken(): Promise<string | null> {
  const storedRefresh = localStorage.getItem('refreshToken');
  if (!storedRefresh) return null;

  try {
    const response = await fetch(`${BASE_URL}/api/admin/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: storedRefresh }),
    });

    if (!response.ok) return null;

    const json = await response.json();
    const newToken = json.data?.accessToken;
    if (newToken) {
      setAccessToken(newToken);
      // refreshToken도 갱신 (서버가 새 refreshToken을 발급하는 경우)
      if (json.data?.refreshToken) {
        localStorage.setItem('refreshToken', json.data.refreshToken);
      }
      return newToken;
    }
    return null;
  } catch {
    return null;
  }
}

function clearAuthAndDispatch(): void {
  setAccessToken(null);
  localStorage.removeItem('refreshToken');
  window.dispatchEvent(new CustomEvent('auth-expired'));
}

export async function request<T>(
  path: string,
  options: RequestInit = {},
  _retry = false,
): Promise<T> {
  const token = getAccessToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  const response = await fetch(`${BASE_URL}${path}`, { ...options, headers });

  // 204 No Content (DELETE 응답)
  if (response.status === 204) {
    return undefined as T;
  }

  if (response.status === 401) {
    const errorBody = await response.clone().json().catch(() => ({}));

    // 중복 로그인은 refresh 없이 즉시 모달
    if (
      errorBody?.data?.code === 'DUPLICATE_LOGIN' ||
      errorBody?.message?.includes('다른 기기')
    ) {
      window.dispatchEvent(new CustomEvent('duplicate-login'));
      setAccessToken(null);
      localStorage.removeItem('refreshToken');
      throw new Error('DUPLICATE_LOGIN');
    }

    // refresh 엔드포인트 자체의 401은 재시도하지 않음
    if (path.includes('/api/admin/auth/refresh')) {
      clearAuthAndDispatch();
      throw new Error('REFRESH_FAILED');
    }

    // 이미 재시도한 요청이면 포기
    if (_retry) {
      clearAuthAndDispatch();
      throw new Error('AUTH_FAILED');
    }

    // 일반 401 -> refresh 시도
    if (!isRefreshing) {
      isRefreshing = true;
      refreshPromise = tryRefreshToken().finally(() => {
        isRefreshing = false;
        refreshPromise = null;
      });
    }

    const newToken = await (refreshPromise ?? tryRefreshToken());
    if (newToken) {
      return request<T>(path, options, true);
    }

    clearAuthAndDispatch();
    throw new Error('AUTH_FAILED');
  }

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    const errorCode = errorBody?.data?.code || errorBody?.message || '';
    throw new Error(errorCode || `HTTP ${response.status}: 요청 실패`);
  }

  const json = await response.json();
  if (!json.success) {
    throw new Error(json.message || '요청 실패');
  }
  return json.data as T;
}

// HTTP 메서드 래퍼
export const get = <T>(path: string): Promise<T> =>
  request<T>(path);

export const post = <T>(path: string, body?: unknown): Promise<T> =>
  request<T>(path, {
    method: 'POST',
    body: body ? JSON.stringify(body) : undefined,
  });

export const put = <T>(path: string, body?: unknown): Promise<T> =>
  request<T>(path, {
    method: 'PUT',
    body: body ? JSON.stringify(body) : undefined,
  });

export const patch = <T>(path: string, body?: unknown): Promise<T> =>
  request<T>(path, {
    method: 'PATCH',
    body: body ? JSON.stringify(body) : undefined,
  });

export const del = <T = void>(path: string): Promise<T> =>
  request<T>(path, { method: 'DELETE' });
```

### 3-2. API 함수 파일별 시그니처

#### src/api/auth.ts

```typescript
import { post, request } from './client';
import type { AdminTokenResponse } from '@/types/auth';

interface AdminLoginRequest {
  email: string;
  password: string;
}

export const login = (data: AdminLoginRequest): Promise<AdminTokenResponse> =>
  post<AdminTokenResponse>('/api/admin/auth/login', data);

export const refreshToken = (refreshTokenValue: string): Promise<AdminTokenResponse> =>
  post<AdminTokenResponse>('/api/admin/auth/refresh', { refreshToken: refreshTokenValue });

export const logout = (): Promise<void> =>
  request<void>('/api/admin/auth/logout', { method: 'POST' });
```

#### src/api/users.ts

```typescript
import { get, patch } from './client';
import type { PageResponse } from '@/types/common';
import type {
  UserListResponse,
  UserDetailResponse,
  UserPortfolioResponse,
  UserTradeHistoryResponse,
} from '@/types/user';

interface GetUsersParams {
  email?: string;
  nickname?: string;
  status?: string;
  page?: number;
  size?: number;
}

interface GetUserTradesParams {
  assetType?: string;
  tradeSource?: string;
  page?: number;
  size?: number;
}

function toQueryString(params: Record<string, string | number | undefined>): string {
  const entries = Object.entries(params).filter(([, v]) => v !== undefined && v !== '');
  if (entries.length === 0) return '';
  return '?' + entries.map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`).join('&');
}

export const getUsers = (params: GetUsersParams = {}): Promise<PageResponse<UserListResponse>> =>
  get<PageResponse<UserListResponse>>(
    `/api/admin/users${toQueryString({ ...params, page: params.page ?? 0, size: params.size ?? 20 })}`,
  );

export const getUser = (userId: number): Promise<UserDetailResponse> =>
  get<UserDetailResponse>(`/api/admin/users/${userId}`);

export const getUserPortfolio = (userId: number): Promise<UserPortfolioResponse> =>
  get<UserPortfolioResponse>(`/api/admin/users/${userId}/portfolio`);

export const getUserTrades = (
  userId: number,
  params: GetUserTradesParams = {},
): Promise<PageResponse<UserTradeHistoryResponse>> =>
  get<PageResponse<UserTradeHistoryResponse>>(
    `/api/admin/users/${userId}/trades${toQueryString({ ...params, page: params.page ?? 0, size: params.size ?? 20 })}`,
  );

export const suspendUser = (userId: number, reason: string): Promise<void> =>
  patch<void>(`/api/admin/users/${userId}/suspend`, { reason });
```

#### src/api/events.ts

```typescript
import { get, post, put, del } from './client';
import type { PageResponse } from '@/types/common';
import type { EventResponse, EventCreateRequest, EventUpdateRequest } from '@/types/event';

interface GetEventsParams {
  status?: string;
  page?: number;
  size?: number;
}

export const getEvents = (params: GetEventsParams = {}): Promise<PageResponse<EventResponse>> =>
  get<PageResponse<EventResponse>>(
    `/api/admin/events${toQueryString({ ...params, page: params.page ?? 0, size: params.size ?? 20 })}`,
  );

export const getEvent = (eventId: number): Promise<EventResponse> =>
  get<EventResponse>(`/api/admin/events/${eventId}`);

export const createEvent = (data: EventCreateRequest): Promise<EventResponse> =>
  post<EventResponse>('/api/admin/events', data);

export const updateEvent = (eventId: number, data: EventUpdateRequest): Promise<EventResponse> =>
  put<EventResponse>(`/api/admin/events/${eventId}`, data);

export const deleteEvent = (eventId: number): Promise<void> =>
  del(`/api/admin/events/${eventId}`);

// 내부 헬퍼 (users.ts와 동일 패턴)
function toQueryString(params: Record<string, string | number | undefined>): string {
  const entries = Object.entries(params).filter(([, v]) => v !== undefined && v !== '');
  if (entries.length === 0) return '';
  return '?' + entries.map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`).join('&');
}
```

#### src/api/notices.ts

```typescript
import { get, post, put, del } from './client';
import type { PageResponse } from '@/types/common';
import type { NoticeResponse, NoticeCreateRequest, NoticeUpdateRequest } from '@/types/notice';

interface GetNoticesParams {
  page?: number;
  size?: number;
}

export const getNotices = (params: GetNoticesParams = {}): Promise<PageResponse<NoticeResponse>> =>
  get<PageResponse<NoticeResponse>>(
    `/api/admin/notices?page=${params.page ?? 0}&size=${params.size ?? 20}`,
  );

export const getNotice = (noticeId: number): Promise<NoticeResponse> =>
  get<NoticeResponse>(`/api/admin/notices/${noticeId}`);

export const createNotice = (data: NoticeCreateRequest): Promise<NoticeResponse> =>
  post<NoticeResponse>('/api/admin/notices', data);

export const updateNotice = (noticeId: number, data: NoticeUpdateRequest): Promise<NoticeResponse> =>
  put<NoticeResponse>(`/api/admin/notices/${noticeId}`, data);

export const deleteNotice = (noticeId: number): Promise<void> =>
  del(`/api/admin/notices/${noticeId}`);
```

#### src/api/actionLogs.ts

```typescript
import { get } from './client';
import type { PageResponse } from '@/types/common';
import type { AdminActionLogResponse } from '@/types/actionLog';

interface GetActionLogsParams {
  adminUserId?: number;
  actionType?: string;
  page?: number;
  size?: number;
}

function toQueryString(params: Record<string, string | number | undefined>): string {
  const entries = Object.entries(params).filter(([, v]) => v !== undefined && v !== '');
  if (entries.length === 0) return '';
  return '?' + entries.map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`).join('&');
}

export const getActionLogs = (
  params: GetActionLogsParams = {},
): Promise<PageResponse<AdminActionLogResponse>> =>
  get<PageResponse<AdminActionLogResponse>>(
    `/api/admin/action-logs${toQueryString({ ...params, page: params.page ?? 0, size: params.size ?? 20 })}`,
  );
```

**설계 노트:** `toQueryString` 헬퍼가 3개 파일에서 중복된다. `utils/queryString.ts`로 분리할 수도 있으나, 각 API 파일이 자기 완결적(self-contained)인 것이 bodum-front-app 패턴이므로 현재는 각 파일 내에 유지한다. 구현 단계에서 중복이 불편하면 유틸로 추출해도 무방하다.

---

## 4. 인증 흐름

### 4-1. 흐름도

```
[페이지 로드]
  └─ localStorage에 refreshToken 있음?
       ├─ Yes → POST /api/admin/auth/refresh → accessToken 메모리 저장 → isAuthenticated = true
       │                                       → scheduleTokenRefresh(expiresIn - 300)
       └─ No  → isAuthenticated = false → /login 리다이렉트

[로그인]
  └─ POST /api/admin/auth/login { email, password }
       → accessToken → 모듈 변수 (setAccessToken)
       → refreshToken → localStorage
       → scheduleTokenRefresh(expiresIn - 300)
       → isAuthenticated = true → navigate('/')

[인증 요청]
  └─ Authorization: Bearer {accessToken}

[401 발생]
  └─ errorCode === 'DUPLICATE_LOGIN'?
       ├─ Yes → CustomEvent('duplicate-login') → DuplicateLoginModal 표시 → 확인 클릭 시 clearAuth → /login
       └─ No  → tryRefreshToken()
                 ├─ 성공 → 새 accessToken 저장 → 원래 요청 1회 재시도
                 └─ 실패 → CustomEvent('auth-expired') → AuthContext clearAuth → /login 리다이렉트

[로그아웃]
  └─ POST /api/admin/auth/logout (실패해도 무시)
       → setAccessToken(null) → localStorage.removeItem('refreshToken')
       → clearRefreshTimer() → isAuthenticated = false → /login

[토큰 자동 갱신]
  └─ setTimeout((expiresIn - 300) * 1000, 최소 10초)
       → POST /api/admin/auth/refresh → 새 accessToken 저장
       → 재귀적으로 다음 갱신 스케줄
```

### 4-2. AuthContext 인터페이스

```typescript
// src/context/authContextDef.ts
import { createContext } from 'react';
import type { AdminTokenResponse } from '@/types/auth';

export interface AuthContextValue {
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<AdminTokenResponse>;
  logout: () => void;
  showDuplicateLoginModal: boolean;
  closeDuplicateLoginModal: () => void;
}

export const AuthContext = createContext<AuthContextValue | null>(null);
```

bodum-front-app 대비 변경점: `signup` 제거 (관리자 가입 API 없음).

### 4-3. AuthProvider 구현 설계

```typescript
// src/context/AuthContext.tsx
// bodum-front-app의 AuthContext.tsx를 기반으로 다음을 변경:
// 1. signup 관련 코드 제거
// 2. auth API 경로가 /api/admin/auth/* 인 auth.ts를 import
// 3. login 반환 타입을 AdminTokenResponse로 변경
// 4. 나머지 로직(scheduleTokenRefresh, clearAuth, CustomEvent 리스너 등)은 동일
```

### 4-4. PrivateRoute

```typescript
// src/routes/PrivateRoute.tsx
import type { ReactNode } from 'react';
import { Navigate } from 'react-router';
import { useAuth } from '@/hooks/useAuth';

interface PrivateRouteProps {
  children: ReactNode;
}

export default function PrivateRoute({ children }: PrivateRouteProps) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
}
```

### 4-5. useAuth 훅

```typescript
// src/hooks/useAuth.ts
import { useContext } from 'react';
import { AuthContext } from '@/context/authContextDef';
import type { AuthContextValue } from '@/context/authContextDef';

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
```

---

## 5. 레이아웃 설계

### 5-1. AdminLayout 구조

```
+------------------------------------------------------+
| Header (높이: 56px, 고정)                              |
|   [backoffice-front 로고]           [관리자 | 로그아웃]  |
+----------+-------------------------------------------+
| Sidebar  | Content Area                              |
| (220px)  |   (flex: 1, padding: 24px)                |
|          |                                           |
| - 대시보드 |   {children}                              |
| - 회원관리 |                                           |
| - 이벤트  |                                           |
| - 공지사항 |                                           |
| - 관리로그 |                                           |
|          |                                           |
+----------+-------------------------------------------+
```

### 5-2. AdminLayout.tsx

```typescript
// src/components/layout/AdminLayout.tsx
import type { ReactNode } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';

interface AdminLayoutProps {
  children: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <div className="admin-layout">
      <Header />
      <div className="admin-layout__body">
        <Sidebar />
        <main className="admin-layout__content">
          {children}
        </main>
      </div>
    </div>
  );
}
```

### 5-3. Sidebar.tsx

```typescript
// src/components/layout/Sidebar.tsx
import { NavLink } from 'react-router';

interface MenuItem {
  path: string;
  label: string;
}

const MENU_ITEMS: MenuItem[] = [
  { path: '/', label: '대시보드' },
  { path: '/users', label: '회원 관리' },
  { path: '/events', label: '이벤트 관리' },
  { path: '/notices', label: '공지사항 관리' },
  { path: '/action-logs', label: '관리자 로그' },
];

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <nav className="sidebar__nav">
        {MENU_ITEMS.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
            className={({ isActive }) =>
              `sidebar__link ${isActive ? 'sidebar__link--active' : ''}`
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
```

**설계 포인트:**
- `NavLink`의 `end` prop: 대시보드(`/`)에만 적용하여 `/users` 등에서 대시보드가 active되는 것을 방지
- `isActive` 콜백으로 CSS 클래스 동적 적용

### 5-4. Header.tsx

```typescript
// src/components/layout/Header.tsx
import { useAuth } from '@/hooks/useAuth';

export default function Header() {
  const { logout } = useAuth();

  return (
    <header className="header">
      <div className="header__logo">보듬 백오피스</div>
      <div className="header__actions">
        <button className="header__logout-btn" onClick={logout}>
          로그아웃
        </button>
      </div>
    </header>
  );
}
```

### 5-5. CSS 핵심 규칙 (layout.css)

```css
/* src/styles/layout.css */

.admin-layout {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  min-width: 1024px;
}

.admin-layout__body {
  display: flex;
  flex: 1;
}

.sidebar {
  width: 220px;
  min-width: 220px;
  background: var(--color-sidebar-bg);
  border-right: 1px solid var(--color-border);
  padding-top: 16px;
}

.sidebar__link {
  display: block;
  padding: 12px 24px;
  color: var(--color-text-secondary);
  text-decoration: none;
  font-size: 14px;
  transition: background-color 0.15s, color 0.15s;
}

.sidebar__link:hover {
  background: var(--color-sidebar-hover);
}

.sidebar__link--active {
  color: var(--color-primary);
  background: var(--color-sidebar-active-bg);
  font-weight: 600;
  border-left: 3px solid var(--color-primary);
}

.header {
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  background: #fff;
  border-bottom: 1px solid var(--color-border);
}

.admin-layout__content {
  flex: 1;
  padding: 24px;
  background: var(--color-bg);
  overflow-y: auto;
}
```

---

## 6. 공통 컴포넌트 설계

### 6-1. Pagination

```typescript
// src/components/common/Pagination.tsx

interface PaginationProps {
  page: number;           // 0-indexed (서버 기준)
  totalPages: number;
  onPageChange: (page: number) => void;
}

export default function Pagination({ page, totalPages, onPageChange }: PaginationProps) {
  // 표시 범위: 현재 페이지 중심 최대 10개
  // 예: page=5 → [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] (0-indexed: 0~9)
  const start = Math.max(0, page - 4);
  const end = Math.min(totalPages, start + 10);
  const pages = Array.from({ length: end - start }, (_, i) => start + i);

  if (totalPages <= 1) return null;

  return (
    <div className="pagination">
      <button
        className="pagination__btn"
        disabled={page === 0}
        onClick={() => onPageChange(page - 1)}
        aria-label="이전 페이지"
      >
        이전
      </button>
      {pages.map((p) => (
        <button
          key={p}
          className={`pagination__page ${p === page ? 'pagination__page--active' : ''}`}
          onClick={() => onPageChange(p)}
        >
          {p + 1}  {/* 사용자에게는 1-indexed로 표시 */}
        </button>
      ))}
      <button
        className="pagination__btn"
        disabled={page >= totalPages - 1}
        onClick={() => onPageChange(page + 1)}
        aria-label="다음 페이지"
      >
        다음
      </button>
    </div>
  );
}
```

### 6-2. ConfirmModal

```typescript
// src/components/common/ConfirmModal.tsx
import { useEffect } from 'react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;   // default: "확인"
  cancelLabel?: string;    // default: "취소"
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmModal({
  isOpen,
  title,
  message,
  confirmLabel = '확인',
  cancelLabel = '취소',
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  // ESC 키로 닫기
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    window.addEventListener('keydown', handleKey);
    // 배경 스크롤 잠금
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h3 className="modal-title">{title}</h3>
        <p className="modal-message">{message}</p>
        <div className="modal-actions">
          <button className="btn btn--secondary" onClick={onCancel}>
            {cancelLabel}
          </button>
          <button className="btn btn--danger" onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
```

### 6-3. FormModal

```typescript
// src/components/common/FormModal.tsx
import { useEffect } from 'react';
import type { ReactNode } from 'react';

interface FormModalProps {
  isOpen: boolean;
  title: string;
  children: ReactNode;
  onSubmit: () => void;
  onCancel: () => void;
  submitLabel?: string;    // default: "확인"
  isLoading?: boolean;
}

export default function FormModal({
  isOpen,
  title,
  children,
  onSubmit,
  onCancel,
  submitLabel = '확인',
  isLoading = false,
}: FormModalProps) {
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    window.addEventListener('keydown', handleKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h3 className="modal-title">{title}</h3>
        <div className="modal-body">{children}</div>
        <div className="modal-actions">
          <button className="btn btn--secondary" onClick={onCancel} disabled={isLoading}>
            취소
          </button>
          <button className="btn btn--primary" onClick={onSubmit} disabled={isLoading}>
            {isLoading ? '처리 중...' : submitLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
```

### 6-4. Toast + ToastContext

```typescript
// src/context/ToastContext.tsx
import { createContext, useState, useCallback, useContext } from 'react';
import type { ReactNode } from 'react';

type ToastType = 'success' | 'error' | 'info';

interface ToastItem {
  id: number;
  type: ToastType;
  message: string;
}

interface ToastContextValue {
  toasts: ToastItem[];
  showToast: (type: ToastType, message: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

let nextId = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const showToast = useCallback((type: ToastType, message: string) => {
    const id = ++nextId;
    setToasts((prev) => {
      // 최대 3개 유지
      const next = [...prev, { id, type, message }];
      return next.slice(-3);
    });
    // 3초 후 자동 제거
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, showToast }}>
      {children}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within ToastProvider');
  return context;
}
```

```typescript
// src/components/common/Toast.tsx
import { useToast } from '@/context/ToastContext';

export default function Toast() {
  const { toasts } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div className="toast-container">
      {toasts.map((toast) => (
        <div key={toast.id} className={`toast toast--${toast.type}`}>
          {toast.message}
        </div>
      ))}
    </div>
  );
}
```

**설계 노트:** `useToast`를 `hooks/useToast.ts`에 별도 파일로 분리할 수도 있으나, ToastContext.tsx에서 직접 export하는 것이 더 간결하다. `hooks/useToast.ts`는 re-export 용도로만 사용한다.

```typescript
// src/hooks/useToast.ts
export { useToast } from '@/context/ToastContext';
```

### 6-5. StatusBadge

```typescript
// src/components/common/StatusBadge.tsx

interface StatusBadgeProps {
  value: string;
  labelMap?: Record<string, string>;   // 예: { ACTIVE: '활성', SUSPENDED: '정지' }
  colorMap?: Record<string, string>;   // 예: { ACTIVE: 'green', SUSPENDED: 'red' }
}

// 기본 매핑
const DEFAULT_LABELS: Record<string, string> = {
  ACTIVE: '활성',
  SUSPENDED: '정지',
  DELETED: '삭제',
  UPCOMING: '예정',
  ONGOING: '진행중',
  ENDED: '종료',
};

const DEFAULT_COLORS: Record<string, string> = {
  ACTIVE: 'green',
  SUSPENDED: 'red',
  DELETED: 'gray',
  UPCOMING: 'blue',
  ONGOING: 'green',
  ENDED: 'gray',
};

export default function StatusBadge({ value, labelMap, colorMap }: StatusBadgeProps) {
  const label = (labelMap ?? DEFAULT_LABELS)[value] ?? value;
  const color = (colorMap ?? DEFAULT_COLORS)[value] ?? 'gray';

  return (
    <span className={`badge badge--${color}`}>
      {label}
    </span>
  );
}
```

### 6-6. LoadingSpinner (bodum-front-app 이식)

```typescript
// src/components/common/LoadingSpinner.tsx
// bodum-front-app의 LoadingSpinner.tsx를 그대로 복사.
// CSS 변수(--color-border-light, --color-primary)만 base.css에서 정의되어 있으면 동작한다.

export default function LoadingSpinner() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '40px' }}>
      <div style={{
        width: 32, height: 32, border: '3px solid var(--color-border-light)',
        borderTop: '3px solid var(--color-primary)', borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
```

### 6-7. DuplicateLoginModal (bodum-front-app 이식)

```typescript
// src/components/common/DuplicateLoginModal.tsx
// bodum-front-app과 동일. modal-overlay, modal-content CSS 클래스는 common.css에서 정의.

interface DuplicateLoginModalProps {
  show: boolean;
  onClose: () => void;
}

export default function DuplicateLoginModal({ show, onClose }: DuplicateLoginModalProps) {
  if (!show) return null;
  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-icon">&#9888;</div>
        <h3>다른 기기에서 로그인</h3>
        <p>다른 기기에서 로그인되어 현재 세션이 만료되었습니다.</p>
        <p>본인이 아닌 경우 비밀번호를 변경해주세요.</p>
        <button className="btn btn--primary" onClick={onClose}>
          확인
        </button>
      </div>
    </div>
  );
}
```

---

## 7. 페이지별 설계

### 7-1. App.tsx (라우팅)

```typescript
// src/App.tsx
import { Routes, Route, Navigate } from 'react-router';
import { useAuth } from '@/hooks/useAuth';
import AdminLayout from '@/components/layout/AdminLayout';
import DuplicateLoginModal from '@/components/common/DuplicateLoginModal';
import Toast from '@/components/common/Toast';
import PrivateRoute from '@/routes/PrivateRoute';
import LoginPage from '@/pages/LoginPage';
import DashboardPage from '@/pages/DashboardPage';
import UserListPage from '@/pages/users/UserListPage';
import UserDetailPage from '@/pages/users/UserDetailPage';
import EventListPage from '@/pages/events/EventListPage';
import EventFormPage from '@/pages/events/EventFormPage';
import NoticeListPage from '@/pages/notices/NoticeListPage';
import NoticeFormPage from '@/pages/notices/NoticeFormPage';
import ActionLogPage from '@/pages/ActionLogPage';

export default function App() {
  const { showDuplicateLoginModal, closeDuplicateLoginModal } = useAuth();

  return (
    <>
      <DuplicateLoginModal show={showDuplicateLoginModal} onClose={closeDuplicateLoginModal} />
      <Toast />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        {/* 인증 필요 라우트: AdminLayout 래핑 */}
        <Route path="/" element={<PrivateRoute><AdminLayout><DashboardPage /></AdminLayout></PrivateRoute>} />
        <Route path="/users" element={<PrivateRoute><AdminLayout><UserListPage /></AdminLayout></PrivateRoute>} />
        <Route path="/users/:userId" element={<PrivateRoute><AdminLayout><UserDetailPage /></AdminLayout></PrivateRoute>} />
        <Route path="/events" element={<PrivateRoute><AdminLayout><EventListPage /></AdminLayout></PrivateRoute>} />
        <Route path="/events/new" element={<PrivateRoute><AdminLayout><EventFormPage /></AdminLayout></PrivateRoute>} />
        <Route path="/events/:eventId" element={<PrivateRoute><AdminLayout><EventFormPage /></AdminLayout></PrivateRoute>} />
        <Route path="/notices" element={<PrivateRoute><AdminLayout><NoticeListPage /></AdminLayout></PrivateRoute>} />
        <Route path="/notices/new" element={<PrivateRoute><AdminLayout><NoticeFormPage /></AdminLayout></PrivateRoute>} />
        <Route path="/notices/:noticeId" element={<PrivateRoute><AdminLayout><NoticeFormPage /></AdminLayout></PrivateRoute>} />
        <Route path="/action-logs" element={<PrivateRoute><AdminLayout><ActionLogPage /></AdminLayout></PrivateRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}
```

### 7-2. main.tsx

```typescript
// src/main.tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router';
import { AuthProvider } from '@/context/AuthContext';
import { ToastProvider } from '@/context/ToastContext';
import App from './App';
import '@/styles/base.css';
import '@/styles/layout.css';
import '@/styles/common.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <App />
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
);
```

### 7-3. LoginPage

```
사용 API: POST /api/admin/auth/login
상태: email, password, errorMessage, isLoading
하위 컴포넌트: 없음 (단독 폼)
```

```typescript
// src/pages/LoginPage.tsx
import { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate, Navigate } from 'react-router';
import { useAuth } from '@/hooks/useAuth';
import '@/styles/pages/login.css';

export default function LoginPage() {
  const { isAuthenticated, login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // 이미 인증된 상태면 대시보드로 리다이렉트
  if (isAuthenticated) return <Navigate to="/" replace />;

  const ERROR_MESSAGES: Record<string, string> = {
    INVALID_CREDENTIALS: '이메일 또는 비밀번호가 올바르지 않습니다',
    ACCOUNT_SUSPENDED: '정지된 계정입니다',
    ACCOUNT_DELETED: '삭제된 계정입니다',
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setIsLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      const msg = err instanceof Error ? err.message : '';
      setErrorMessage(ERROR_MESSAGES[msg] ?? '로그인에 실패했습니다');
    } finally {
      setIsLoading(false);
    }
  };

  const isFormValid = email.trim() !== '' && password.trim() !== '';

  return (
    <div className="login-page">
      <form className="login-form" onSubmit={handleSubmit}>
        <h1 className="login-title">보듬 백오피스</h1>
        <div className="form-group">
          <label htmlFor="email">이메일</label>
          <input
            id="email" type="email" value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="admin@example.com"
            autoComplete="email"
          />
        </div>
        <div className="form-group">
          <label htmlFor="password">비밀번호</label>
          <input
            id="password" type="password" value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="비밀번호를 입력하세요"
            autoComplete="current-password"
          />
        </div>
        {errorMessage && <p className="form-error">{errorMessage}</p>}
        <button type="submit" className="btn btn--primary btn--full" disabled={!isFormValid || isLoading}>
          {isLoading ? '로그인 중...' : '로그인'}
        </button>
      </form>
    </div>
  );
}
```

### 7-4. DashboardPage

```
사용 API: 없음 (링크 허브)
상태: 없음
하위 컴포넌트: 없음
```

```typescript
// src/pages/DashboardPage.tsx
import { useNavigate } from 'react-router';
import '@/styles/pages/dashboard.css';

interface DashboardCard {
  title: string;
  description: string;
  path: string;
}

const CARDS: DashboardCard[] = [
  { title: '회원 관리', description: '회원 조회, 정지 처리', path: '/users' },
  { title: '이벤트 관리', description: '이벤트 생성, 수정, 삭제', path: '/events' },
  { title: '공지사항 관리', description: '공지사항 생성, 수정, 삭제', path: '/notices' },
  { title: '관리자 로그', description: '관리자 액션 이력 조회', path: '/action-logs' },
];

export default function DashboardPage() {
  const navigate = useNavigate();

  return (
    <div className="dashboard">
      <h2 className="page-title">대시보드</h2>
      <div className="dashboard__cards">
        {CARDS.map((card) => (
          <div
            key={card.path}
            className="dashboard__card"
            onClick={() => navigate(card.path)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && navigate(card.path)}
          >
            <h3>{card.title}</h3>
            <p>{card.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
```

### 7-5. UserListPage

```
사용 API: GET /api/admin/users (getUsers)
상태: users[], page, totalPages, isLoading, 검색 필터 (email, nickname, status)
하위 컴포넌트: Pagination, LoadingSpinner, StatusBadge
```

```typescript
// src/pages/users/UserListPage.tsx 설계

// 상태
const [users, setUsers] = useState<UserListResponse[]>([]);
const [page, setPage] = useState(0);
const [totalPages, setTotalPages] = useState(0);
const [isLoading, setIsLoading] = useState(false);
const [filters, setFilters] = useState({ email: '', nickname: '', status: '' });

// URL query string 동기화 (BR-USER-02)
// useSearchParams()로 필터와 page를 URL에 반영
// 뒤로가기 시 필터 상태 복원

// 데이터 조회
const fetchUsers = async () => {
  setIsLoading(true);
  try {
    const result = await getUsers({ ...filters, page });
    setUsers(result.content);
    setTotalPages(result.totalPages);
  } catch (err) {
    showToast('error', '회원 목록 조회에 실패했습니다');
  } finally {
    setIsLoading(false);
  }
};

// useEffect: page 또는 filters 변경 시 fetchUsers 호출

// 검색 폼
// <form> 내 email(input), nickname(input), status(select: 전체/ACTIVE/SUSPENDED/DELETED)
// 검색 버튼 + 초기화 버튼

// 테이블 컬럼: ID, 이메일, 닉네임, 역할, 상태(StatusBadge), 가입일
// 행 클릭 시 navigate(`/users/${user.id}`)

// 하단: <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
```

### 7-6. UserDetailPage

```
사용 API: GET /api/admin/users/{userId} (getUser), PATCH /api/admin/users/{userId}/suspend (suspendUser), GET .../portfolio, GET .../trades
상태: user (UserDetailResponse), activeTab ('info'|'portfolio'|'trades'), 정지 모달 상태
하위 컴포넌트: FormModal, StatusBadge, LoadingSpinner, Pagination
```

```typescript
// src/pages/users/UserDetailPage.tsx 설계

// URL 파라미터
const { userId } = useParams<{ userId: string }>();
const [searchParams, setSearchParams] = useSearchParams();
const activeTab = searchParams.get('tab') || 'info';

// 기본 정보 상태
const [user, setUser] = useState<UserDetailResponse | null>(null);
const [isLoading, setIsLoading] = useState(true);

// 정지 모달 상태
const [showSuspendModal, setShowSuspendModal] = useState(false);
const [suspendReason, setSuspendReason] = useState('');
const [isSuspending, setIsSuspending] = useState(false);

// 포트폴리오 상태 (tab === 'portfolio' 일 때만 조회)
const [portfolio, setPortfolio] = useState<UserPortfolioResponse | null>(null);
const [portfolioLoading, setPortfolioLoading] = useState(false);

// 거래 내역 상태 (tab === 'trades' 일 때만 조회)
const [trades, setTrades] = useState<UserTradeHistoryResponse[]>([]);
const [tradesPage, setTradesPage] = useState(0);
const [tradesTotalPages, setTradesTotalPages] = useState(0);
const [tradesLoading, setTradesLoading] = useState(false);
const [tradeFilters, setTradeFilters] = useState({ assetType: '', tradeSource: '' });

// 탭 전환
const handleTabChange = (tab: string) => {
  setSearchParams({ tab });
};

// 정지 처리
const handleSuspend = async () => {
  if (suspendReason.length < 1 || suspendReason.length > 1000) return;
  setIsSuspending(true);
  try {
    await suspendUser(Number(userId), suspendReason);
    showToast('success', '회원이 정지되었습니다');
    setShowSuspendModal(false);
    setSuspendReason('');
    // 상세 정보 재조회
    const updated = await getUser(Number(userId));
    setUser(updated);
  } catch (err) {
    const msg = err instanceof Error ? err.message : '';
    if (msg.includes('USER_ALREADY_SUSPENDED')) {
      showToast('error', '이미 정지된 회원입니다');
    } else if (msg.includes('USER_DELETED')) {
      showToast('error', '삭제된 회원은 정지할 수 없습니다');
    } else {
      showToast('error', '정지 처리에 실패했습니다');
    }
  } finally {
    setIsSuspending(false);
  }
};

// 렌더링:
// 1. 탭 네비게이션 (정보 | 포트폴리오 | 거래내역)
// 2. tab === 'info': 프로필 정보 + 정지 버튼
//    - status === 'ACTIVE': "정지" 버튼 표시
//    - status === 'SUSPENDED': "이미 정지된 회원입니다" 문구
//    - status === 'DELETED': 정지 버튼 없음
// 3. tab === 'portfolio': 지갑 요약 카드 + 보유 종목 테이블
//    - 수익률 양수(빨강) / 음수(파랑)
// 4. tab === 'trades': 필터(assetType, tradeSource select) + 거래 테이블 + Pagination
```

### 7-7. EventListPage

```
사용 API: GET /api/admin/events (getEvents)
상태: events[], page, totalPages, isLoading, statusFilter
하위 컴포넌트: Pagination, LoadingSpinner, StatusBadge
```

```typescript
// 상태 필터: 전체 / UPCOMING / ONGOING / ENDED (select)
// 테이블 컬럼: ID, 제목, 상태(StatusBadge), 시작일시, 종료일시, 활성화(O/X), 생성일
// "이벤트 생성" 버튼 → navigate('/events/new')
// 행 클릭 → navigate(`/events/${event.id}`)
// 하단: Pagination
```

### 7-8. EventFormPage (생성/수정 통합)

```
사용 API: POST /api/admin/events (createEvent), GET (getEvent), PUT (updateEvent), DELETE (deleteEvent)
상태: title, content, startAt, endAt, isActive, isLoading, isEdit, dateError
하위 컴포넌트: ConfirmModal (삭제 확인)
```

```typescript
// src/pages/events/EventFormPage.tsx 설계

// URL 파라미터로 생성/수정 모드 판별
const { eventId } = useParams<{ eventId: string }>();
const isEdit = !!eventId;

// 폼 상태
const [title, setTitle] = useState('');
const [content, setContent] = useState('');
const [startAt, setStartAt] = useState('');   // datetime-local 형식: "2026-04-08T09:00"
const [endAt, setEndAt] = useState('');
const [isActive, setIsActive] = useState(true);
const [isLoading, setIsLoading] = useState(false);
const [dateError, setDateError] = useState('');
const [showDeleteModal, setShowDeleteModal] = useState(false);

// 수정 모드: useEffect에서 getEvent(eventId)로 기존 데이터 로드
// startAt/endAt은 ISO 8601 → datetime-local 형식으로 변환 (slice(0, 16))

// 유효성 검증
// - title 필수, 최대 200자
// - content 필수
// - startAt 필수, endAt 필수
// - endAt > startAt 검증 → 실패 시 dateError = "종료일은 시작일보다 이후여야 합니다"

// 저장 처리
const handleSave = async () => {
  // 클라이언트 검증
  if (new Date(endAt) <= new Date(startAt)) {
    setDateError('종료일은 시작일보다 이후여야 합니다');
    return;
  }
  setIsLoading(true);
  try {
    const payload = { title, content, startAt, endAt, isActive };
    if (isEdit) {
      await updateEvent(Number(eventId), payload);
    } else {
      const created = await createEvent(payload);
      navigate(`/events/${created.id}`, { replace: true });
    }
    showToast('success', '저장되었습니다');
  } catch (err) {
    const msg = err instanceof Error ? err.message : '';
    if (msg.includes('INVALID_EVENT_DATE')) {
      showToast('error', '시작일은 종료일보다 이전이어야 합니다');
    } else {
      showToast('error', '저장에 실패했습니다');
    }
  } finally {
    setIsLoading(false);
  }
};

// 삭제 처리
const handleDelete = async () => {
  try {
    await deleteEvent(Number(eventId));
    showToast('success', '삭제되었습니다');
    navigate('/events');
  } catch {
    showToast('error', '삭제에 실패했습니다');
  }
};

// 렌더링:
// - 제목 input (maxLength=200, 글자 수 카운터: "{title.length}/200")
// - 본문 textarea (min-height: 200px)
// - 시작일시 <input type="datetime-local" />
// - 종료일시 <input type="datetime-local" />
// - dateError 인라인 표시
// - isActive 토글 스위치
// - 저장/취소 버튼
// - 수정 모드에서만: 삭제 버튼 → ConfirmModal
```

### 7-9. NoticeListPage

```
사용 API: GET /api/admin/notices (getNotices)
상태: notices[], page, totalPages, isLoading
하위 컴포넌트: Pagination, LoadingSpinner
```

```typescript
// 테이블 컬럼: ID, 제목, 공개 여부(O/X 뱃지), 고정 여부(O/X 뱃지), 작성자(createdBy), 생성일
// "공지사항 생성" 버튼 → navigate('/notices/new')
// 행 클릭 → navigate(`/notices/${notice.id}`)
// 하단: Pagination
```

### 7-10. NoticeFormPage (생성/수정 통합)

```
사용 API: POST (createNotice), GET (getNotice), PUT (updateNotice), DELETE (deleteNotice)
상태: title, content, isPublished, isPinned, isLoading, isEdit
하위 컴포넌트: ConfirmModal (삭제 확인)
```

```typescript
// EventFormPage와 동일 패턴
// - 제목 input (maxLength=200, 글자 수 카운터)
// - 본문 textarea
// - isPublished 토글 (기본: false)
// - isPinned 토글 (기본: false)
// - 저장/취소/삭제(수정 모드만)
```

### 7-11. ActionLogPage

```
사용 API: GET /api/admin/action-logs (getActionLogs)
상태: logs[], page, totalPages, isLoading, 필터 (adminUserId, actionType)
하위 컴포넌트: Pagination, LoadingSpinner
```

```typescript
// 필터: adminUserId (숫자 입력), actionType (텍스트 입력)
// 테이블 컬럼: ID, 관리자ID, 액션 유형, 대상 유형, 대상 ID, 상세(null이면 "-"), 생성일시
// 읽기 전용 (생성/수정/삭제 없음)
// 하단: Pagination
```

---

## 8. TypeScript 타입 정의

### 8-1. common.ts

```typescript
// src/types/common.ts

export interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  message: string | null;
}

export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export type EventStatus = 'UPCOMING' | 'ONGOING' | 'ENDED';
export type AssetType = 'CRYPTO' | 'STOCK';
export type TradeType = 'BUY' | 'SELL';
export type TradeSource = 'MANUAL' | 'BOT';
export type UserStatus = 'ACTIVE' | 'SUSPENDED' | 'DELETED';
```

### 8-2. auth.ts

```typescript
// src/types/auth.ts

export interface AdminLoginRequest {
  email: string;
  password: string;
}

export interface AdminRefreshRequest {
  refreshToken: string;
}

export interface AdminTokenResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}
```

### 8-3. user.ts

```typescript
// src/types/user.ts

import type { AssetType, TradeType, TradeSource, UserStatus } from './common';

export interface UserListResponse {
  id: number;
  email: string;
  nickname: string;
  role: string;
  status: UserStatus;
  createdAt: string;
}

export interface UserDetailResponse {
  id: number;
  email: string;
  nickname: string;
  profileImageUrl: string | null;
  role: string;
  status: UserStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Holding {
  assetType: AssetType;
  assetCode: string;
  assetName: string;
  quantity: number;
  avgBuyPrice: number;
  currentPrice: number;
  evaluationAmount: number;
  profitAmount: number;
  profitRate: number;
}

export interface Portfolio {
  balance: number;
  holdings: Holding[];
  totalEvaluation: number;
  totalProfitAmount: number;
  totalProfitRate: number;
  cryptoEvaluation: number;
  cryptoProfitRate: number;
  stockEvaluation: number;
  stockProfitRate: number;
}

export interface Wallet {
  balance: number;
  initialBalance: number;
  totalAssetValue: number;
  totalReturnRate: number;
}

export interface UserPortfolioResponse {
  portfolio: Portfolio;
  wallet: Wallet;
}

export interface UserTradeHistoryResponse {
  tradeId: number;
  assetType: AssetType;
  assetCode: string;
  assetName: string;
  tradeType: TradeType;
  quantity: number;
  price: number;
  totalAmount: number;
  tradeSource: TradeSource;
  botReason: string | null;
  tradedAt: string | null;
}

export interface UserSuspendRequest {
  reason: string;
}
```

### 8-4. event.ts

```typescript
// src/types/event.ts

import type { EventStatus } from './common';

export interface EventResponse {
  id: number;
  title: string;
  content: string;
  startAt: string;
  endAt: string;
  isActive: boolean;
  status: EventStatus;
  createdBy: number;
  createdAt: string;
  updatedAt: string;
}

export interface EventCreateRequest {
  title: string;
  content: string;
  startAt: string;
  endAt: string;
  isActive: boolean;
}

export interface EventUpdateRequest {
  title?: string;
  content?: string;
  startAt?: string;
  endAt?: string;
  isActive?: boolean;
}
```

### 8-5. notice.ts

```typescript
// src/types/notice.ts

export interface NoticeResponse {
  id: number;
  title: string;
  content: string;
  isPublished: boolean;
  isPinned: boolean;
  createdBy: number;
  createdAt: string;
  updatedAt: string;
}

export interface NoticeCreateRequest {
  title: string;
  content: string;
  isPublished: boolean;
  isPinned: boolean;
}

export interface NoticeUpdateRequest {
  title?: string;
  content?: string;
  isPublished?: boolean;
  isPinned?: boolean;
}
```

### 8-6. actionLog.ts

```typescript
// src/types/actionLog.ts

export interface AdminActionLogResponse {
  id: number;
  adminUserId: number;
  actionType: string;
  targetType: string;
  targetId: number;
  detail: string | null;
  createdAt: string;
}
```

### 8-7. index.ts (배럴 export)

```typescript
// src/types/index.ts
export * from './common';
export * from './auth';
export * from './user';
export * from './event';
export * from './notice';
export * from './actionLog';
```

---

## 9. Vite 설정

### 9-1. vite.config.ts

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5174,  // bodum-front-app(5173)과 충돌 방지
    proxy: {
      '/api/admin': {
        target: 'http://localhost:8083',
        changeOrigin: true,
      },
    },
  },
});
```

### 9-2. tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

### 9-3. 환경변수

별도 `.env` 파일은 사용하지 않는다. API base URL은 빈 문자열(`''`)을 사용하고 Vite proxy로 처리한다. 프로덕션 배포 시 nginx 리버스 프록시로 대체한다.

---

## 10. 스타일링 전략

### 10-1. 방침

- 순수 CSS 사용 (UI 라이브러리 없음, bodum-front-app 패턴 준수)
- CSS 변수로 색상/간격 통일
- BEM 네이밍 (block__element--modifier)
- 최소 지원 뷰포트: 1024px (`min-width: 1024px` on `.admin-layout`)

### 10-2. CSS 파일 구조 및 역할

```
src/styles/
├── base.css              # CSS 변수, 리셋, 폰트, 기본 요소
├── layout.css            # .admin-layout, .sidebar, .header
├── common.css            # .btn, .form-group, .table, .pagination, .modal, .toast, .badge, .toggle
└── pages/
    ├── login.css         # .login-page, .login-form
    ├── dashboard.css     # .dashboard, .dashboard__cards, .dashboard__card
    ├── users.css         # .user-list, .user-detail, .user-portfolio, .user-trades, .search-form
    ├── events.css        # .event-list, .event-form
    ├── notices.css       # .notice-list, .notice-form
    └── action-logs.css   # .action-log-list
```

### 10-3. base.css — CSS 변수

```css
/* src/styles/base.css */

:root {
  /* 색상 */
  --color-primary: #2563eb;
  --color-primary-hover: #1d4ed8;
  --color-danger: #dc2626;
  --color-danger-hover: #b91c1c;
  --color-success: #16a34a;
  --color-warning: #f59e0b;
  --color-info: #0ea5e9;

  /* 텍스트 */
  --color-text: #1f2937;
  --color-text-secondary: #6b7280;
  --color-text-light: #9ca3af;

  /* 배경 */
  --color-bg: #f9fafb;
  --color-bg-white: #ffffff;
  --color-sidebar-bg: #1f2937;
  --color-sidebar-hover: #374151;
  --color-sidebar-active-bg: #111827;

  /* 경계 */
  --color-border: #e5e7eb;
  --color-border-light: #f3f4f6;

  /* 수익률 */
  --color-profit-positive: #dc2626;  /* 빨강 — 양수 (한국 주식 관행) */
  --color-profit-negative: #2563eb;  /* 파랑 — 음수 */

  /* 뱃지 */
  --badge-green-bg: #dcfce7;
  --badge-green-text: #166534;
  --badge-red-bg: #fef2f2;
  --badge-red-text: #991b1b;
  --badge-blue-bg: #dbeafe;
  --badge-blue-text: #1e40af;
  --badge-gray-bg: #f3f4f6;
  --badge-gray-text: #374151;

  /* 간격 */
  --spacing-xs: 4px;
  --spacing-sm: 8px;
  --spacing-md: 16px;
  --spacing-lg: 24px;
  --spacing-xl: 32px;

  /* 폰트 */
  --font-family: 'Pretendard', -apple-system, BlinkMacSystemFont, sans-serif;
  --font-size-sm: 13px;
  --font-size-base: 14px;
  --font-size-lg: 16px;
  --font-size-xl: 20px;
  --font-size-2xl: 24px;

  /* 그림자 */
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.07);

  /* 반경 */
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;
}

/* 리셋 */
*, *::before, *::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: var(--font-family);
  font-size: var(--font-size-base);
  color: var(--color-text);
  background: var(--color-bg);
  line-height: 1.5;
}

a {
  text-decoration: none;
  color: inherit;
}

button {
  cursor: pointer;
  border: none;
  background: none;
  font-family: inherit;
  font-size: inherit;
}

input, textarea, select {
  font-family: inherit;
  font-size: inherit;
}
```

### 10-4. common.css — 공통 클래스 (주요 발췌)

```css
/* 버튼 */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 8px 16px;
  border-radius: var(--radius-sm);
  font-weight: 500;
  transition: background-color 0.15s;
}

.btn--primary { background: var(--color-primary); color: #fff; }
.btn--primary:hover { background: var(--color-primary-hover); }
.btn--primary:disabled { opacity: 0.5; cursor: not-allowed; }

.btn--danger { background: var(--color-danger); color: #fff; }
.btn--danger:hover { background: var(--color-danger-hover); }

.btn--secondary { background: var(--color-border); color: var(--color-text); }
.btn--secondary:hover { background: #d1d5db; }

.btn--full { width: 100%; }

/* 폼 */
.form-group { margin-bottom: var(--spacing-md); }
.form-group label { display: block; margin-bottom: var(--spacing-xs); font-weight: 500; color: var(--color-text-secondary); }
.form-group input,
.form-group select,
.form-group textarea {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  outline: none;
  transition: border-color 0.15s;
}
.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus { border-color: var(--color-primary); }

.form-error { color: var(--color-danger); font-size: var(--font-size-sm); margin-top: var(--spacing-xs); }

/* 테이블 */
.table-wrapper { overflow-x: auto; }
.table { width: 100%; border-collapse: collapse; }
.table th, .table td { padding: 12px 16px; text-align: left; border-bottom: 1px solid var(--color-border); }
.table th { background: var(--color-bg); font-weight: 600; color: var(--color-text-secondary); font-size: var(--font-size-sm); }
.table tr:hover { background: #f9fafb; }
.table tr { cursor: pointer; }
.table-empty { text-align: center; padding: 40px; color: var(--color-text-light); }

/* 모달 */
.modal-overlay {
  position: fixed; inset: 0; background: rgba(0, 0, 0, 0.5);
  display: flex; align-items: center; justify-content: center; z-index: 1000;
}
.modal-content {
  background: #fff; border-radius: var(--radius-lg); padding: var(--spacing-lg);
  max-width: 480px; width: 90%; box-shadow: var(--shadow-md);
}
.modal-title { font-size: var(--font-size-lg); font-weight: 600; margin-bottom: var(--spacing-md); }
.modal-message { color: var(--color-text-secondary); margin-bottom: var(--spacing-lg); }
.modal-actions { display: flex; gap: var(--spacing-sm); justify-content: flex-end; }

/* 토스트 */
.toast-container {
  position: fixed; bottom: 24px; right: 24px; z-index: 2000;
  display: flex; flex-direction: column; gap: 8px;
}
.toast {
  padding: 12px 20px; border-radius: var(--radius-md); color: #fff;
  font-size: var(--font-size-sm); box-shadow: var(--shadow-md);
  animation: toast-in 0.3s ease;
}
.toast--success { background: var(--color-success); }
.toast--error { background: var(--color-danger); }
.toast--info { background: var(--color-info); }
@keyframes toast-in { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

/* 뱃지 */
.badge {
  display: inline-block; padding: 2px 8px; border-radius: 12px;
  font-size: var(--font-size-sm); font-weight: 500;
}
.badge--green { background: var(--badge-green-bg); color: var(--badge-green-text); }
.badge--red { background: var(--badge-red-bg); color: var(--badge-red-text); }
.badge--blue { background: var(--badge-blue-bg); color: var(--badge-blue-text); }
.badge--gray { background: var(--badge-gray-bg); color: var(--badge-gray-text); }

/* 페이지네이션 */
.pagination { display: flex; justify-content: center; gap: 4px; margin-top: var(--spacing-lg); }
.pagination__btn,
.pagination__page {
  padding: 6px 12px; border: 1px solid var(--color-border); border-radius: var(--radius-sm);
  background: #fff; color: var(--color-text);
}
.pagination__btn:disabled { opacity: 0.4; cursor: not-allowed; }
.pagination__page--active { background: var(--color-primary); color: #fff; border-color: var(--color-primary); }

/* 토글 스위치 */
.toggle { position: relative; display: inline-block; width: 44px; height: 24px; }
.toggle input { opacity: 0; width: 0; height: 0; }
.toggle__slider {
  position: absolute; inset: 0; background: #ccc; border-radius: 24px; cursor: pointer;
  transition: background-color 0.2s;
}
.toggle__slider::before {
  content: ''; position: absolute; height: 18px; width: 18px; left: 3px; bottom: 3px;
  background: #fff; border-radius: 50%; transition: transform 0.2s;
}
.toggle input:checked + .toggle__slider { background: var(--color-primary); }
.toggle input:checked + .toggle__slider::before { transform: translateX(20px); }

/* 페이지 공통 */
.page-title { font-size: var(--font-size-2xl); font-weight: 700; margin-bottom: var(--spacing-lg); }
.page-actions { display: flex; justify-content: flex-end; margin-bottom: var(--spacing-md); }

/* 검색 폼 */
.search-form { display: flex; gap: var(--spacing-sm); align-items: flex-end; margin-bottom: var(--spacing-lg); flex-wrap: wrap; }
.search-form .form-group { margin-bottom: 0; }
```

### 10-5. 페이지별 CSS 로딩 방식

각 페이지 컴포넌트 파일 최상단에서 `import '@/styles/pages/xxx.css'`로 로딩한다. Vite가 필요 시 코드 스플리팅으로 최적화한다.

---

## 11. utils/format.ts

```typescript
// src/utils/format.ts

import type { AssetType, TradeType, TradeSource, UserStatus, EventStatus } from '@/types/common';

/** ISO 8601 → "2026.04.08 09:00" */
export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

/** 숫자 → "1,234,567" */
export function formatNumber(num: number | null | undefined, decimals: number = 0): string {
  if (num == null) return '0';
  return Number(num).toLocaleString('ko-KR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/** 숫자 → "1,234,567원" */
export function formatKRW(amount: number | null | undefined): string {
  if (amount == null) return '0원';
  return Number(amount).toLocaleString('ko-KR') + '원';
}

/** 수익률 → "+12.34%" */
export function formatPercent(rate: number | null | undefined): string {
  if (rate == null) return '0%';
  const num = Number(rate);
  const prefix = num > 0 ? '+' : '';
  return `${prefix}${num.toFixed(2)}%`;
}

/** 수량 (암호화폐: 최대 8자리, 주식: 정수) */
export function formatQuantity(qty: number | null | undefined, assetType: AssetType): string {
  if (qty == null) return '0';
  const decimals = assetType === 'CRYPTO' ? 8 : 0;
  return Number(qty).toLocaleString('ko-KR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  });
}

/** 한글 변환 맵 */
export const USER_STATUS_LABEL: Record<UserStatus, string> = {
  ACTIVE: '활성',
  SUSPENDED: '정지',
  DELETED: '삭제',
};

export const EVENT_STATUS_LABEL: Record<EventStatus, string> = {
  UPCOMING: '예정',
  ONGOING: '진행중',
  ENDED: '종료',
};

export const ASSET_TYPE_LABEL: Record<AssetType, string> = {
  CRYPTO: '암호화폐',
  STOCK: '주식',
};

export const TRADE_TYPE_LABEL: Record<TradeType, string> = {
  BUY: '매수',
  SELL: '매도',
};

export const TRADE_SOURCE_LABEL: Record<TradeSource, string> = {
  MANUAL: '수동',
  BOT: '자동',
};

/** ISO 8601 → datetime-local 입력값 ("2026-04-08T09:00") */
export function toDatetimeLocalValue(isoStr: string): string {
  return isoStr.slice(0, 16);
}

/** 수익률 색상 클래스 (양수: red, 음수: blue, 0: 기본) */
export function profitColorClass(rate: number | null | undefined): string {
  if (rate == null || rate === 0) return '';
  return rate > 0 ? 'text-profit-positive' : 'text-profit-negative';
}
```

---

## 12. 구현 순서 권장

구현자가 의존성 순서대로 작업할 수 있도록 권장 순서를 제시한다.

| 단계 | 파일/범위 | 설명 |
|------|----------|------|
| 1 | 프로젝트 초기화 | `npm create vite@latest`, package.json, tsconfig, vite.config.ts |
| 2 | `types/` 전체 | 모든 타입 정의 (API 작업 전 선행 필요) |
| 3 | `styles/base.css`, `layout.css`, `common.css` | CSS 변수와 공통 스타일 |
| 4 | `api/client.ts` | fetch 래퍼 (핵심 인프라) |
| 5 | `api/auth.ts` + `context/` + `hooks/` | 인증 인프라 |
| 6 | `components/common/` 전체 | 공통 컴포넌트 |
| 7 | `components/layout/` + `routes/` | 레이아웃, PrivateRoute |
| 8 | `App.tsx` + `main.tsx` | 라우팅 조립 |
| 9 | `pages/LoginPage.tsx` | 로그인 (인증 검증) |
| 10 | `pages/DashboardPage.tsx` | 대시보드 |
| 11 | `api/users.ts` + `pages/users/` | 회원 관리 |
| 12 | `api/events.ts` + `pages/events/` | 이벤트 관리 |
| 13 | `api/notices.ts` + `pages/notices/` | 공지사항 관리 |
| 14 | `api/actionLogs.ts` + `pages/ActionLogPage.tsx` | 관리자 로그 |
| 15 | `utils/format.ts` | 유틸리티 (필요 시점에 점진적으로 작성해도 무방) |
| 16 | `styles/pages/` | 페이지별 CSS (해당 페이지 구현 시 함께 작성) |

---

## 13. 설계 판단 기록

| 항목 | 판단 | 근거 |
|------|------|------|
| 날짜 라이브러리 | 미사용 (네이티브 Date + datetime-local) | 날짜 선택 UI가 이벤트 생성/수정에서만 사용되며, `<input type="datetime-local">`로 충분. 외부 의존성 최소화 원칙. |
| toQueryString 중복 | 각 API 파일 내 인라인 유지 | bodum-front-app 패턴이 파일 자기 완결적이므로 유지. 필요 시 utils로 추출 가능. |
| 상태 관리 | React Context (Auth, Toast만) | 관리자 화면은 복잡한 전역 상태가 없음. 각 페이지에서 useState로 충분. |
| 사이드바 반응형 | min-width: 1024px, 축소/토글 없음 | 관리자 화면은 데스크톱 전용. 모바일 지원 Out of Scope. |
| 폼 라이브러리 | 미사용 (네이티브 form + useState) | 폼이 간단(최대 5개 필드)하여 react-hook-form 등 불필요. |
| 이벤트/공지 상세 vs 수정 | 수정 폼으로 통합 | planner 판단 준수. 관리자 특성상 항상 수정 가능 상태가 자연스러움. |
| dev 서버 포트 | 5174 | bodum-front-app(5173)과 동시 개발 시 충돌 방지. |
| CSS 네이밍 | BEM | 순수 CSS에서 스코핑 없이 충돌 방지에 효과적. |

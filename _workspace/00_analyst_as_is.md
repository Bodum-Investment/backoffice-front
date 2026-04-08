# AS-IS 분석 보고서 — backoffice-front

분석일: 2026-04-08
분석 대상:
- backoffice-core (서버): `/Users/jinhojeong/Desktop/private/backoffice-core/`
- bodum-front-app (참조 프론트): `/Users/jinhojeong/Desktop/private/bodum-front-app/`

---

## 1. backoffice-core API 목록

### 서버 정보
- 포트: `8083`
- 베이스 URL: `/api/admin`
- 인증 방식: JWT Bearer Token (Authorization 헤더)
- 공통 응답 포맷: `{ success: boolean, data: T | null, message: string | null }`
- 페이지 응답 포맷: `{ content: T[], page: number, size: number, totalElements: number, totalPages: number }`

### 인증 미필요 엔드포인트
- `POST /api/admin/auth/login`
- `POST /api/admin/auth/refresh`

### 1-1. 인증 (Auth) — `/api/admin/auth`

| 메서드 | 경로 | 설명 | 인증 필요 |
|--------|------|------|-----------|
| POST | `/api/admin/auth/login` | 관리자 로그인 | X |
| POST | `/api/admin/auth/refresh` | 토큰 갱신 | X |
| POST | `/api/admin/auth/logout` | 로그아웃 | O |

**요청/응답 타입**

로그인 요청 (`AdminLoginRequest`):
```typescript
{ email: string; password: string }
```

토큰 갱신 요청 (`AdminRefreshRequest`):
```typescript
{ refreshToken: string }
```

토큰 응답 (`AdminTokenResponse`):
```typescript
{ accessToken: string; refreshToken: string; expiresIn: number }
```

로그아웃 응답:
```typescript
string // "로그아웃 완료"
```

---

### 1-2. 회원 관리 (User) — `/api/admin/users`

| 메서드 | 경로 | 설명 | 인증 필요 |
|--------|------|------|-----------|
| GET | `/api/admin/users` | 회원 목록 조회 (검색/페이징) | O |
| GET | `/api/admin/users/{userId}` | 회원 상세 조회 | O |
| GET | `/api/admin/users/{userId}/portfolio` | 회원 포트폴리오 조회 | O |
| GET | `/api/admin/users/{userId}/trades` | 회원 거래 내역 조회 (페이징) | O |
| PATCH | `/api/admin/users/{userId}/suspend` | 회원 정지 처리 | O |

**요청 파라미터**

회원 목록 (`GET /api/admin/users`):
- Query: `email?: string`, `nickname?: string`, `status?: string`, `page: number = 0`, `size: number = 20` (최대 100)

회원 거래 내역 (`GET /api/admin/users/{userId}/trades`):
- Query: `assetType?: string`, `tradeSource?: string`, `page: number = 0`, `size: number = 20` (최대 100)

회원 정지 요청 (`UserSuspendRequest`):
```typescript
{ reason: string } // 1~1000자
```

**응답 타입**

회원 목록 (`UserListResponse`):
```typescript
{
  id: number;
  email: string;
  nickname: string;
  role: string;
  status: string;
  createdAt: string; // ISO 8601
}
```

회원 상세 (`UserDetailResponse`):
```typescript
{
  id: number;
  email: string;
  nickname: string;
  profileImageUrl: string | null;
  role: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}
```

포트폴리오 (`UserPortfolioResponse`):
```typescript
{
  portfolio: {
    balance: number;
    holdings: Array<{
      assetType: string;       // "CRYPTO" | "STOCK"
      assetCode: string;
      assetName: string;
      quantity: number;
      avgBuyPrice: number;
      currentPrice: number;
      evaluationAmount: number;
      profitAmount: number;
      profitRate: number;
    }>;
    totalEvaluation: number;
    totalProfitAmount: number;
    totalProfitRate: number;
    cryptoEvaluation: number;
    cryptoProfitRate: number;
    stockEvaluation: number;
    stockProfitRate: number;
  };
  wallet: {
    balance: number;
    initialBalance: number;
    totalAssetValue: number;
    totalReturnRate: number;
  };
}
```

거래 내역 (`UserTradeHistoryResponse` = `TradeHistoryDto`):
```typescript
{
  tradeId: number;
  assetType: string;       // "CRYPTO" | "STOCK"
  assetCode: string;
  assetName: string;
  tradeType: string;       // "BUY" | "SELL" [용어 확인 필요]
  quantity: number;
  price: number;
  totalAmount: number;
  tradeSource: string;     // "MANUAL" | "BOT" [용어 확인 필요]
  botReason: string | null;
  tradedAt: string | null;
}
```

---

### 1-3. 공지사항 (Notice) — `/api/admin/notices`

| 메서드 | 경로 | 설명 | 인증 필요 |
|--------|------|------|-----------|
| GET | `/api/admin/notices` | 공지사항 목록 (페이징) | O |
| POST | `/api/admin/notices` | 공지사항 생성 | O |
| GET | `/api/admin/notices/{noticeId}` | 공지사항 상세 | O |
| PUT | `/api/admin/notices/{noticeId}` | 공지사항 수정 | O |
| DELETE | `/api/admin/notices/{noticeId}` | 공지사항 삭제 (204) | O |

**요청/응답 타입**

생성 요청 (`NoticeCreateRequest`):
```typescript
{
  title: string;       // 최대 200자
  content: string;
  isPublished: boolean; // default: false
  isPinned: boolean;    // default: false
}
```

수정 요청 (`NoticeUpdateRequest`):
```typescript
{
  title?: string;       // 최대 200자
  content?: string;
  isPublished?: boolean;
  isPinned?: boolean;
}
```

응답 (`NoticeResponse`):
```typescript
{
  id: number;
  title: string;
  content: string;
  isPublished: boolean;
  isPinned: boolean;
  createdBy: number;   // adminUserId
  createdAt: string;
  updatedAt: string;
}
```

---

### 1-4. 이벤트 (Event) — `/api/admin/events`

| 메서드 | 경로 | 설명 | 인증 필요 |
|--------|------|------|-----------|
| GET | `/api/admin/events` | 이벤트 목록 (상태 필터/페이징) | O |
| POST | `/api/admin/events` | 이벤트 생성 | O |
| GET | `/api/admin/events/{eventId}` | 이벤트 상세 | O |
| PUT | `/api/admin/events/{eventId}` | 이벤트 수정 | O |
| DELETE | `/api/admin/events/{eventId}` | 이벤트 삭제 (204) | O |

**요청 파라미터**

이벤트 목록 (`GET /api/admin/events`):
- Query: `status?: "UPCOMING" | "ONGOING" | "ENDED"`, `page: number = 0`, `size: number = 20`

생성 요청 (`EventCreateRequest`):
```typescript
{
  title: string;       // 최대 200자
  content: string;
  startAt: string;     // ISO 8601
  endAt: string;       // ISO 8601 (startAt보다 이후여야 함)
  isActive: boolean;   // default: true
}
```

수정 요청 (`EventUpdateRequest`):
```typescript
{
  title?: string;
  content?: string;
  startAt?: string;
  endAt?: string;
  isActive?: boolean;
}
```

응답 (`EventResponse`):
```typescript
{
  id: number;
  title: string;
  content: string;
  startAt: string;
  endAt: string;
  isActive: boolean;
  status: "UPCOMING" | "ONGOING" | "ENDED"; // 서버에서 자동 계산
  createdBy: number;   // adminUserId
  createdAt: string;
  updatedAt: string;
}
```

---

### 1-5. 관리자 액션 로그 (Action Log) — `/api/admin/action-logs`

| 메서드 | 경로 | 설명 | 인증 필요 |
|--------|------|------|-----------|
| GET | `/api/admin/action-logs` | 액션 로그 목록 (필터/페이징) | O |

**요청 파라미터**
- Query: `adminUserId?: number`, `actionType?: string`, `page: number = 0`, `size: number = 20`

**응답 타입** (`AdminActionLogResponse`):
```typescript
{
  id: number;
  adminUserId: number;
  actionType: string;
  targetType: string;
  targetId: number;
  detail: string | null;
  createdAt: string;
}
```

---

### 1-6. 에러 코드

| 에러 코드 | HTTP 상태 | 메시지 |
|-----------|-----------|--------|
| INVALID_CREDENTIALS | 401 | 이메일 또는 비밀번호가 올바르지 않습니다 |
| NOT_ADMIN | 403 | 관리자 권한이 필요합니다 |
| ACCOUNT_SUSPENDED | 401 | 정지된 계정입니다 |
| ACCOUNT_DELETED | 401 | 삭제된 계정입니다 |
| INVALID_REFRESH_TOKEN | 401 | 유효하지 않은 리프레시 토큰입니다 |
| DUPLICATE_LOGIN | 401 | 다른 기기에서 로그인되었습니다 |
| UNAUTHORIZED | 401 | 인증이 필요합니다 |
| USER_NOT_FOUND | 404 | 사용자를 찾을 수 없습니다 |
| USER_ALREADY_SUSPENDED | 409 | 이미 정지된 회원입니다 |
| USER_DELETED | 400 | 삭제된 회원은 블락킹할 수 없습니다 |
| EVENT_NOT_FOUND | 404 | 이벤트를 찾을 수 없습니다 |
| INVALID_EVENT_DATE | 400 | 시작일은 종료일보다 이전이어야 합니다 |
| NOTICE_NOT_FOUND | 404 | 공지사항을 찾을 수 없습니다 |
| USER_CORE_ERROR | 502 | User 서비스 호출에 실패했습니다 |
| TRADE_CORE_ERROR | 502 | Trading 서비스 호출에 실패했습니다 |
| INVALID_REQUEST | 400 | 잘못된 요청입니다 |

---

## 2. bodum-front-app 기술 스택 및 패턴 분석

### 2-1. 기술 스택

| 항목 | 사용 기술 | 버전 |
|------|-----------|------|
| 프레임워크 | React | 19.1.0 |
| 언어 | TypeScript | 6.0.2 |
| 빌드 도구 | Vite | 7.0.4 |
| 라우팅 | react-router | 7.7.0 |
| 상태 관리 | React Context API | - |
| UI 라이브러리 | 없음 (순수 CSS) | - |
| 외부 라이브러리 | 없음 (fetch API 사용) | - |

### 2-2. 프로젝트 구조 패턴

```
src/
├── api/              # API 호출 함수 (도메인별 파일 분리)
│   ├── client.ts     # fetch 래퍼, 토큰 관리, 401 재시도 로직
│   ├── auth.ts       # 인증 API
│   └── ...
├── context/          # React Context (인증 상태 관리)
│   ├── AuthContext.tsx
│   └── authContextDef.ts
├── hooks/            # 커스텀 훅
│   └── useAuth.ts
├── pages/            # 라우팅 단위 페이지 컴포넌트
├── components/       # 재사용 공통 컴포넌트
│   └── common/
│       ├── Header.tsx
│       ├── BottomNav.tsx
│       ├── LoadingSpinner.tsx
│       └── DuplicateLoginModal.tsx
├── styles/           # CSS 파일 (pages/, base.css, common.css, layout.css)
├── types/            # TypeScript 타입 정의
└── utils/            # 유틸리티 함수
```

### 2-3. API 호출 패턴 (client.ts)

**핵심 설계 원칙:**
- accessToken은 메모리(모듈 변수)에만 보관 — XSS 방어
- refreshToken만 `localStorage`에 저장
- 401 발생 시 자동 refresh 후 원래 요청 1회 재시도
- `DUPLICATE_LOGIN` 에러 시 즉시 모달 표시 (refresh 없이)
- 인증 만료 시 `auth-expired` CustomEvent 발행 → Context가 감지해 로그아웃 처리

**API 함수 패턴:**
```typescript
// client.ts에서 제공하는 래퍼
export const get = <T>(path: string): Promise<T> => request<T>(path);
export const post = <T>(path: string, body?: unknown): Promise<T> => ...;

// 도메인별 api 파일에서 사용
export const login = (data: LoginRequest): Promise<LoginResponse> =>
  post<LoginResponse>('/api/auth/login', data);
```

응답 포맷: `{ success: boolean, data: T }` → `client.ts`가 `json.data`만 반환

### 2-4. 인증 Context 패턴

```typescript
interface AuthContextValue {
  isAuthenticated: boolean;
  login: (email, password) => Promise<LoginResponse>;
  logout: () => void;
  showDuplicateLoginModal: boolean;
  closeDuplicateLoginModal: () => void;
}
```

- `PrivateRoute` 컴포넌트로 미인증 접근 차단 → `/login` 리다이렉트
- 페이지 로드 시 `localStorage`의 refreshToken으로 자동 토큰 재발급
- accessToken 만료 5분 전 자동 갱신 타이머 (`scheduleTokenRefresh`)

### 2-5. 라우팅 패턴 (App.tsx)

```tsx
<Route path="/login" element={<LoginPage />} />  // 공개
<Route path="/" element={<PrivateRoute><DashboardPage /></PrivateRoute>} />  // 보호
```

### 2-6. vite.config.ts 프록시 패턴

```typescript
server: {
  proxy: {
    '/api/xxx': { target: 'http://localhost:PORT', changeOrigin: true },
  }
}
```

### 2-7. TypeScript 설정 특이사항

- `strict: true` (전체 엄격 모드)
- `noUnusedLocals: true`, `noUnusedParameters: true` (미사용 변수 오류)
- Path alias: `@/*` → `./src/*`
- `moduleResolution: "bundler"` (Vite 번들러 모드)

---

## 3. backoffice-front 필요 화면 목록 (API 기반 도출)

### 3-1. 화면 목록

| # | 화면명 | 경로 | 사용 API | 인증 |
|---|--------|------|----------|------|
| 1 | 로그인 | `/login` | POST /api/admin/auth/login | X |
| 2 | 대시보드 (홈) | `/` | — (링크 허브) | O |
| 3 | 회원 목록 | `/users` | GET /api/admin/users | O |
| 4 | 회원 상세 | `/users/:userId` | GET /api/admin/users/{userId} | O |
| 5 | 회원 포트폴리오 | `/users/:userId/portfolio` | GET /api/admin/users/{userId}/portfolio | O |
| 6 | 회원 거래 내역 | `/users/:userId/trades` | GET /api/admin/users/{userId}/trades | O |
| 7 | 공지사항 목록 | `/notices` | GET /api/admin/notices | O |
| 8 | 공지사항 생성 | `/notices/new` | POST /api/admin/notices | O |
| 9 | 공지사항 상세/수정 | `/notices/:noticeId` | GET, PUT /api/admin/notices/{noticeId} | O |
| 10 | 이벤트 목록 | `/events` | GET /api/admin/events | O |
| 11 | 이벤트 생성 | `/events/new` | POST /api/admin/events | O |
| 12 | 이벤트 상세/수정 | `/events/:eventId` | GET, PUT /api/admin/events/{eventId} | O |
| 13 | 관리자 액션 로그 | `/action-logs` | GET /api/admin/action-logs | O |

### 3-2. 화면별 주요 기능

**로그인 화면**
- 이메일/비밀번호 입력, 로그인 버튼
- 에러 표시: INVALID_CREDENTIALS, ACCOUNT_SUSPENDED, ACCOUNT_DELETED

**회원 목록 화면**
- 검색 필터: email, nickname, status
- 페이징 (기본 20개)
- 회원 상세로 이동 링크

**회원 상세 화면**
- 기본 정보 (email, nickname, profileImage, role, status, createdAt)
- 회원 정지 버튼 → 이유 입력 모달 → PATCH /suspend 호출
- 탭: 포트폴리오, 거래 내역으로 이동

**회원 포트폴리오 탭**
- 지갑 정보: balance, initialBalance, totalAssetValue, totalReturnRate
- 보유 종목 목록: assetType/Code/Name, quantity, avgBuyPrice, profitRate 등
- 전체 수익률 요약

**회원 거래 내역 탭**
- 필터: assetType, tradeSource
- 페이징
- 거래 상세: tradeType, assetCode, price, totalAmount, tradedAt

**공지사항/이벤트 목록 화면**
- 목록 테이블, 페이징
- 이벤트: status 필터 (UPCOMING/ONGOING/ENDED)
- 생성 버튼

**공지사항 생성/수정 화면**
- 제목 (최대 200자), 본문 (텍스트)
- 공개 여부 (isPublished), 고정 여부 (isPinned) 토글
- 저장/취소

**이벤트 생성/수정 화면**
- 제목 (최대 200자), 본문
- 시작일시/종료일시 (datetimepicker)
- 활성화 여부 (isActive) 토글
- 유효성: startAt < endAt

**관리자 액션 로그 화면**
- 필터: adminUserId, actionType
- 읽기 전용 목록 (생성 API 없음)

---

## 4. backoffice-front 구현 시 재사용 권장 패턴

### bodum-front-app에서 그대로 차용할 패턴

1. **`client.ts` 구조** — accessToken 메모리 보관, 401 자동 refresh, CustomEvent 기반 만료 처리
   - 단, `BASE_URL`을 `''` → `''` 유지하고 vite proxy 설정에 `/api/admin/*` → `http://localhost:8083` 추가

2. **AuthContext 패턴** — `isAuthenticated` 상태, `login/logout`, 중복 로그인 모달 처리
   - `signup` 제거, 관리자용으로 단순화

3. **PrivateRoute 패턴** — 미인증 접근 시 `/login` 리다이렉트

4. **TypeScript 설정** — tsconfig.json의 strict 설정, path alias `@/*` 그대로 사용

5. **도메인별 api 파일 분리** — `src/api/auth.ts`, `src/api/users.ts`, `src/api/notices.ts` 등

### backoffice-front에서 새로 추가할 부분

1. **사이드바 레이아웃** — 백오피스 특성상 BottomNav 대신 좌측 사이드바 네비게이션
2. **테이블 + 페이징 컴포넌트** — 모든 목록 화면에서 공통 사용
3. **모달 컴포넌트** — 회원 정지 사유 입력, 삭제 확인 등
4. **날짜 입력 컴포넌트** — 이벤트 생성/수정용 datetime-local 입력
5. **토스트/알림 컴포넌트** — API 성공/실패 피드백

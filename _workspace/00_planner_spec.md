# backoffice-front 기능 명세 (PRD)

작성일: 2026-04-08
작성 기준: AS-IS 분석 보고서 (`00_analyst_as_is.md`) 기반

---

## 1. 프로젝트 개요

### 배경 및 목적
보듬모의투자 서비스의 관리자용 백오피스 웹 프론트엔드 신규 구축.
기존 사용자 앱(bodum-front-app)의 API 클라이언트 패턴을 재사용하여 개발 효율을 높이고, backoffice-core(포트 8083)와 연동한다.

### 핵심 제약
- 순수 CSS (UI 라이브러리 미사용) — bodum-front-app 패턴 준수
- React 19 + TypeScript + Vite (SPA)
- 최소 지원 뷰포트: 1024px
- 백엔드 기인증 방식: JWT (accessToken 메모리, refreshToken localStorage)

### AS-IS 요약
- backoffice-core API는 완성되어 있으나, 이를 조작할 관리자 웹 UI가 없음
- bodum-front-app에 구현된 API 클라이언트 패턴(401 자동 재시도, 중복 로그인 처리, CustomEvent 기반 만료)을 그대로 차용 가능
- 신규 추가 필요 요소: 사이드바 레이아웃, 테이블/페이징 공통 컴포넌트, 모달, 토스트

---

## 2. 범위

### In Scope (P0 — 필수)
| 화면 | 설명 |
|------|------|
| 로그인 | 관리자 이메일/비밀번호 인증 |
| 대시보드 | 메인 홈 — 각 섹션 진입점 |
| 회원 목록 | 검색, 필터, 페이지네이션 |
| 회원 상세 | 정보 열람 + 블락킹(정지) |
| 회원 포트폴리오 탭 | 지갑/보유종목 조회 |
| 회원 거래 내역 탭 | 거래 필터, 페이지네이션 |
| 공지사항 목록 | 목록 + 페이지네이션 |
| 공지사항 생성/수정/삭제 | CRUD 전체 |
| 이벤트 목록 | 상태 필터 + 페이지네이션 |
| 이벤트 생성/수정/삭제 | CRUD 전체 |
| 관리자 액션 로그 | 읽기 전용, 필터, 페이지네이션 |

### Out of Scope
- 관리자 계정 생성/관리 (backoffice-core에 API 없음)
- 회원 정지 해제 API (backoffice-core에 API 없음 — 미결정 사항 참조)
- 회원 삭제 기능 (backoffice-core에 API 없음)
- 실시간 알림/웹소켓
- 다국어(i18n) 지원
- 다크모드
- 모바일 뷰(< 1024px)

---

## 3. 라우팅 구조

```
/login                          — 공개 (비인증)
/                               — PrivateRoute → 대시보드
/users                          — PrivateRoute → 회원 목록
/users/:userId                  — PrivateRoute → 회원 상세 (기본 탭: 정보)
/users/:userId?tab=portfolio    — 회원 상세 (포트폴리오 탭, query param 방식)
/users/:userId?tab=trades       — 회원 상세 (거래 내역 탭, query param 방식)
/notices                        — PrivateRoute → 공지사항 목록
/notices/new                    — PrivateRoute → 공지사항 생성
/notices/:noticeId              — PrivateRoute → 공지사항 상세/수정
/events                         — PrivateRoute → 이벤트 목록
/events/new                     — PrivateRoute → 이벤트 생성
/events/:eventId                — PrivateRoute → 이벤트 상세/수정
/action-logs                    — PrivateRoute → 관리자 액션 로그
```

**판단** — 회원 포트폴리오/거래내역을 별도 경로(/users/:id/portfolio)가 아닌 query param 탭으로 구현:
이유: 회원 상세 컨텍스트(기본 정보)를 유지한 채 탭 전환이 자연스럽고, 사이드바에서 별도 메뉴로 노출할 필요가 없음. AS-IS 화면 목록에 별도 경로를 제안했으나 UX 단순화를 위해 탭 방식을 선택.

---

## 4. 공통 컴포넌트 정의

### 4-1. Layout
```
src/components/layout/
├── AdminLayout.tsx     # 전체 레이아웃 래퍼
├── Sidebar.tsx         # 좌측 사이드바 네비게이션
└── Header.tsx          # 상단 헤더 (로그인 사용자명, 로그아웃 버튼)
```

**Sidebar 메뉴 항목:**
- 대시보드 (/)
- 회원 관리 (/users)
- 이벤트 관리 (/events)
- 공지사항 관리 (/notices)
- 관리자 로그 (/action-logs)

**수용 기준:**
- AC: 현재 경로와 일치하는 메뉴 항목에 활성 스타일(active class)이 적용되어야 한다
- AC: 사이드바 너비는 고정(예: 220px), 콘텐츠 영역은 나머지 공간을 flex로 채워야 한다
- AC: 뷰포트 1024px 미만에서는 레이아웃 깨짐을 허용하되 스크롤은 가능해야 한다

### 4-2. Pagination
```
src/components/common/Pagination.tsx
```

**Props:**
```typescript
interface PaginationProps {
  page: number;         // 0-indexed (서버 기준)
  totalPages: number;
  onPageChange: (page: number) => void;
}
```

**수용 기준:**
- AC: 현재 페이지 번호가 시각적으로 강조되어야 한다
- AC: 첫 페이지에서 이전 버튼은 비활성화되어야 한다
- AC: 마지막 페이지에서 다음 버튼은 비활성화되어야 한다
- AC: 표시 페이지 범위는 최대 10개 (현재 페이지 중심으로 앞뒤 5페이지)

### 4-3. Table
```
src/components/common/Table.tsx
```

**설계 원칙:** 제네릭 사용 지양 — 각 도메인 화면에서 직접 `<table>` 마크업 사용. 공통 Table 컴포넌트는 스타일 클래스 통일 목적으로 래퍼 역할만 담당.

**수용 기준:**
- AC: 데이터가 없으면 "데이터가 없습니다" 문구가 표시되어야 한다
- AC: 로딩 중에는 행 대신 LoadingSpinner가 표시되어야 한다

### 4-4. Modal

**두 종류:**

1. `ConfirmModal.tsx` — 삭제 확인용
```typescript
interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;   // default: "확인"
  cancelLabel?: string;    // default: "취소"
  onConfirm: () => void;
  onCancel: () => void;
}
```

2. `FormModal.tsx` — 입력 폼용 (회원 정지 사유 등)
```typescript
interface FormModalProps {
  isOpen: boolean;
  title: string;
  children: React.ReactNode;
  onSubmit: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}
```

**수용 기준:**
- AC: 모달이 열리면 배경 스크롤이 잠겨야 한다
- AC: ESC 키 입력 시 모달이 닫혀야 한다
- AC: 배경 오버레이 클릭 시 모달이 닫혀야 한다 (ConfirmModal은 선택적)
- AC: isLoading이 true일 때 제출 버튼은 비활성화되어야 한다

### 4-5. Toast / Alert
```
src/components/common/Toast.tsx
src/context/ToastContext.tsx
```

**토스트 타입:** `"success" | "error" | "info"`

**수용 기준:**
- AC: 화면 우측 하단에 고정 위치로 표시되어야 한다
- AC: 3초 후 자동으로 사라져야 한다
- AC: 동시에 최대 3개까지 스택으로 표시되어야 한다
- AC: `useToast()` 훅으로 어느 컴포넌트에서든 토스트를 발행할 수 있어야 한다

### 4-6. LoadingSpinner
```
src/components/common/LoadingSpinner.tsx
```
bodum-front-app의 `LoadingSpinner.tsx`를 그대로 이식.

### 4-7. DuplicateLoginModal
```
src/components/common/DuplicateLoginModal.tsx
```
bodum-front-app 패턴 이식. `DUPLICATE_LOGIN` 에러 발생 시 표시, 확인 클릭 시 로그아웃 후 `/login`으로 이동.

---

## 5. 화면별 기능 명세

### 5-1. 로그인 페이지 (`/login`)

**사용자 스토리**
- As a 관리자, I want 이메일과 비밀번호로 로그인하고 싶다, so that 백오피스에 접근할 수 있다.

**수용 기준**
- AC: 이메일과 비밀번호 모두 입력된 경우에만 로그인 버튼이 활성화되어야 한다
- AC: 로그인 성공 시 `/`(대시보드)로 이동해야 한다
- AC: 이미 인증된 상태에서 `/login` 접근 시 `/`로 리다이렉트되어야 한다
- AC: `INVALID_CREDENTIALS` → "이메일 또는 비밀번호가 올바르지 않습니다" 오류 메시지를 폼 하단에 표시해야 한다
- AC: `ACCOUNT_SUSPENDED` → "정지된 계정입니다" 오류 메시지를 표시해야 한다
- AC: `ACCOUNT_DELETED` → "삭제된 계정입니다" 오류 메시지를 표시해야 한다
- AC: API 호출 중 버튼은 로딩 상태(비활성화)여야 한다
- AC: Enter 키로 로그인 폼 제출이 가능해야 한다

**API 매핑**
- `POST /api/admin/auth/login` → `{ email, password }` → `AdminTokenResponse`

**비즈니스 규칙**
| 규칙 ID | 규칙 | 조건 | 동작 |
|---------|------|------|------|
| BR-AUTH-01 | accessToken 메모리 보관 | 로그인 성공 | `setAccessToken(token)` 모듈 함수 호출 (localStorage 미사용) |
| BR-AUTH-02 | refreshToken 저장 | 로그인 성공 | `localStorage.setItem('refreshToken', token)` |
| BR-AUTH-03 | 자동 갱신 스케줄 | 로그인 성공 | `expiresIn` 기반으로 만료 5분 전 타이머 설정 |

---

### 5-2. 대시보드 (`/`)

**사용자 스토리**
- As a 관리자, I want 주요 섹션으로 빠르게 이동하고 싶다, so that 업무를 효율적으로 처리할 수 있다.

**수용 기준**
- AC: 회원 관리, 이벤트 관리, 공지사항 관리, 관리자 로그로의 링크 카드가 표시되어야 한다
- AC: 각 카드 클릭 시 해당 목록 페이지로 이동해야 한다

**판단** — 대시보드에 별도 API를 연동하지 않음:
이유: backoffice-core에 통계 요약 API가 없으므로, 링크 허브 역할만 수행. 추후 백엔드에 통계 API가 추가되면 확장.

---

### 5-3. 회원 목록 (`/users`)

**사용자 스토리**
- As a 관리자, I want 회원을 검색하고 목록을 조회하고 싶다, so that 특정 회원의 상태를 확인하고 관리할 수 있다.

**수용 기준**
- AC: 이메일, 닉네임, 상태(status) 세 가지 검색 필터가 제공되어야 한다
- AC: 검색 버튼 클릭 또는 Enter 입력 시 page=0부터 조회해야 한다
- AC: 필터 초기화 버튼 클릭 시 모든 검색 조건이 지워지고 전체 목록을 재조회해야 한다
- AC: 목록 컬럼: ID, 이메일, 닉네임, 역할(role), 상태(status), 가입일(createdAt)
- AC: status 값은 한글로 표시해야 한다 (ACTIVE→활성, SUSPENDED→정지, DELETED→삭제)
- AC: 행 클릭 시 `/users/:userId` 상세 페이지로 이동해야 한다
- AC: 페이지당 20개, 페이지네이션 컴포넌트가 하단에 표시되어야 한다
- AC: 조회 중 테이블 영역에 LoadingSpinner가 표시되어야 한다

**API 매핑**
- `GET /api/admin/users?email=&nickname=&status=&page=0&size=20`

**비즈니스 규칙**
| 규칙 ID | 규칙 |
|---------|------|
| BR-USER-01 | status 필터 값: `ACTIVE`, `SUSPENDED`, `DELETED` (서버 enum 그대로 전달) |
| BR-USER-02 | 검색 필터는 URL query string에 동기화하여 뒤로가기 시 복원 가능하게 한다 |

---

### 5-4. 회원 상세 (`/users/:userId`)

**사용자 스토리**
- As a 관리자, I want 특정 회원의 상세 정보를 조회하고 싶다, so that 회원 상태를 파악하고 필요 시 정지 처리를 할 수 있다.

**수용 기준 — 기본 정보 탭**
- AC: 프로필 이미지(없으면 기본 이미지 대체), 이메일, 닉네임, 역할, 상태, 가입일, 수정일이 표시되어야 한다
- AC: 탭 (정보 / 포트폴리오 / 거래내역)이 표시되어야 하며, query param `tab`으로 전환되어야 한다
- AC: 목록으로 돌아가기 버튼이 있어야 한다 (`/users`)

**수용 기준 — 블락킹(정지) 기능**
- AC: status가 `ACTIVE`인 회원에게만 "정지" 버튼이 활성화되어야 한다
- AC: status가 `SUSPENDED`이면 "이미 정지된 회원입니다" 문구를 버튼 대신 표시해야 한다
- AC: status가 `DELETED`이면 정지 버튼이 없어야 한다
- AC: "정지" 버튼 클릭 시 FormModal이 열리고, 사유(reason) 텍스트 입력란이 있어야 한다
- AC: 사유는 1자 이상 1000자 이하여야 하며, 조건 미충족 시 폼 제출이 막혀야 한다
- AC: 정지 성공 시 모달이 닫히고, 회원 상세 정보를 재조회하고, "회원이 정지되었습니다" 토스트가 표시되어야 한다
- AC: `USER_ALREADY_SUSPENDED` 에러 시 "이미 정지된 회원입니다" 토스트(error)가 표시되어야 한다
- AC: `USER_DELETED` 에러 시 "삭제된 회원은 정지할 수 없습니다" 토스트(error)가 표시되어야 한다

**API 매핑**
- `GET /api/admin/users/{userId}` → `UserDetailResponse`
- `PATCH /api/admin/users/{userId}/suspend` → `{ reason: string }`

**비즈니스 규칙**
| 규칙 ID | 규칙 |
|---------|------|
| BR-USER-03 | 정지 사유 최소 1자, 최대 1000자 (서버 제약과 동일하게 클라이언트에서도 검증) |
| BR-USER-04 | 정지 처리 후 페이지 상태를 재조회 (캐시 무효화)하여 최신 상태를 반영한다 |

---

### 5-5. 회원 포트폴리오 탭 (`/users/:userId?tab=portfolio`)

**사용자 스토리**
- As a 관리자, I want 회원의 포트폴리오를 조회하고 싶다, so that 투자 현황을 파악할 수 있다.

**수용 기준**
- AC: 지갑 요약 카드: 잔고(balance), 초기 잔고(initialBalance), 총 자산(totalAssetValue), 총 수익률(totalReturnRate %)이 표시되어야 한다
- AC: 보유 종목 테이블 컬럼: 구분(assetType), 종목코드, 종목명, 수량, 평균매수가, 현재가, 평가금액, 손익금액, 수익률(%)
- AC: assetType은 한글로 표시해야 한다 (CRYPTO→암호화폐, STOCK→주식)
- AC: 보유 종목이 없으면 "보유 종목이 없습니다" 문구를 표시해야 한다
- AC: 전체 수익률 요약(totalProfitAmount, totalProfitRate, 암호화폐/주식별 수익률)이 테이블 하단에 표시되어야 한다
- AC: 수익률 양수는 빨간색, 음수는 파란색으로 표시해야 한다 (한국 주식 관행)

**API 매핑**
- `GET /api/admin/users/{userId}/portfolio` → `UserPortfolioResponse`

---

### 5-6. 회원 거래 내역 탭 (`/users/:userId?tab=trades`)

**사용자 스토리**
- As a 관리자, I want 회원의 거래 내역을 조회하고 싶다, so that 투자 행태를 파악할 수 있다.

**수용 기준**
- AC: 필터: assetType (전체/CRYPTO/STOCK), tradeSource (전체/MANUAL/BOT) 셀렉트박스
- AC: 거래 내역 테이블 컬럼: 거래일시(tradedAt), 구분(assetType), 종목코드, 종목명, 거래유형(tradeType), 수량, 가격, 총금액, 거래방식(tradeSource)
- AC: tradeType은 한글로 표시해야 한다 (BUY→매수, SELL→매도)
- AC: tradeSource는 한글로 표시해야 한다 (MANUAL→수동, BOT→자동)
- AC: tradedAt이 null이면 "-"로 표시해야 한다
- AC: 페이지당 20개, 페이지네이션 컴포넌트가 있어야 한다
- AC: 탭 진입 시 필터 초기값은 전체이며 자동으로 데이터를 조회해야 한다

**API 매핑**
- `GET /api/admin/users/{userId}/trades?assetType=&tradeSource=&page=0&size=20`

---

### 5-7. 이벤트 목록 (`/events`)

**사용자 스토리**
- As a 관리자, I want 이벤트 목록을 조회하고 관리하고 싶다, so that 서비스 이벤트를 운영할 수 있다.

**수용 기준**
- AC: 상태 필터: 전체 / UPCOMING / ONGOING / ENDED 탭 또는 셀렉트박스로 제공되어야 한다
- AC: 이벤트 목록 테이블 컬럼: ID, 제목, 상태(status), 시작일시, 종료일시, 활성화(isActive), 생성일
- AC: status는 한글로 표시해야 한다 (UPCOMING→예정, ONGOING→진행중, ENDED→종료)
- AC: "이벤트 생성" 버튼 클릭 시 `/events/new`로 이동해야 한다
- AC: 행 클릭 시 `/events/:eventId`로 이동해야 한다
- AC: 페이지당 20개, 페이지네이션이 있어야 한다

**API 매핑**
- `GET /api/admin/events?status=&page=0&size=20`

---

### 5-8. 이벤트 생성 (`/events/new`) / 수정 (`/events/:eventId`)

**사용자 스토리**
- As a 관리자, I want 이벤트를 생성·수정·삭제하고 싶다, so that 서비스 이벤트를 관리할 수 있다.

**수용 기준 — 폼**
- AC: 제목(title): 필수, 최대 200자, 글자 수 카운터 표시
- AC: 본문(content): 필수, `<textarea>`, 최소 높이 200px
- AC: 시작일시(startAt): 필수, `datetime-local` 입력
- AC: 종료일시(endAt): 필수, `datetime-local` 입력
- AC: `endAt <= startAt`이면 "종료일은 시작일보다 이후여야 합니다" 오류를 인라인으로 표시하고 제출을 막아야 한다
- AC: 활성화 여부(isActive): 토글 스위치 (기본값: true)
- AC: 저장 버튼 클릭 시 API 호출 중 버튼 비활성화
- AC: 저장 성공 시 `/events/:eventId`로 이동하고 "저장되었습니다" 토스트를 표시해야 한다
- AC: `INVALID_EVENT_DATE` 서버 에러 시 "시작일은 종료일보다 이전이어야 합니다" 토스트(error)를 표시해야 한다

**수용 기준 — 수정 모드 진입**
- AC: `/events/:eventId` 접근 시 기존 데이터를 폼에 미리 채워야 한다
- AC: 수정 모드에서는 "삭제" 버튼이 추가로 표시되어야 한다

**수용 기준 — 삭제**
- AC: "삭제" 버튼 클릭 시 ConfirmModal("이 이벤트를 삭제하시겠습니까?")이 표시되어야 한다
- AC: 삭제 확인 시 `DELETE /api/admin/events/{eventId}` 호출 후 `/events`로 이동하고 "삭제되었습니다" 토스트를 표시해야 한다

**API 매핑**
- 생성: `POST /api/admin/events` → `EventCreateRequest`
- 조회(수정 초기 로드): `GET /api/admin/events/{eventId}`
- 수정: `PUT /api/admin/events/{eventId}` → `EventUpdateRequest`
- 삭제: `DELETE /api/admin/events/{eventId}` (204 No Content)

**비즈니스 규칙**
| 규칙 ID | 규칙 |
|---------|------|
| BR-EVENT-01 | 클라이언트에서 `startAt < endAt` 검증 후 서버에 전송한다 |
| BR-EVENT-02 | datetime-local 값은 ISO 8601 형식(예: `2026-04-08T09:00:00`)으로 변환하여 서버에 전송한다 |
| BR-EVENT-03 | status 필드는 서버에서 자동 계산되므로 생성/수정 폼에 노출하지 않는다 |

---

### 5-9. 공지사항 목록 (`/notices`)

**사용자 스토리**
- As a 관리자, I want 공지사항 목록을 조회하고 싶다, so that 게시된 공지사항을 관리할 수 있다.

**수용 기준**
- AC: 공지사항 목록 테이블 컬럼: ID, 제목, 공개 여부(isPublished), 고정 여부(isPinned), 작성자(createdBy), 생성일
- AC: isPublished, isPinned는 아이콘(O/X 또는 뱃지)으로 표시해야 한다
- AC: "공지사항 생성" 버튼 클릭 시 `/notices/new`로 이동해야 한다
- AC: 행 클릭 시 `/notices/:noticeId`로 이동해야 한다
- AC: 페이지당 20개, 페이지네이션이 있어야 한다

**API 매핑**
- `GET /api/admin/notices?page=0&size=20`

---

### 5-10. 공지사항 생성 (`/notices/new`) / 수정 (`/notices/:noticeId`)

**사용자 스토리**
- As a 관리자, I want 공지사항을 생성·수정·삭제하고 싶다, so that 서비스 공지를 관리할 수 있다.

**수용 기준 — 폼**
- AC: 제목(title): 필수, 최대 200자, 글자 수 카운터 표시
- AC: 본문(content): 필수, `<textarea>`, 최소 높이 200px
- AC: 공개 여부(isPublished): 토글 스위치 (기본값: false)
- AC: 고정 여부(isPinned): 토글 스위치 (기본값: false)
- AC: 저장 성공 시 `/notices/:noticeId`로 이동하고 "저장되었습니다" 토스트를 표시해야 한다

**수용 기준 — 수정 모드 진입**
- AC: `/notices/:noticeId` 접근 시 기존 데이터를 폼에 미리 채워야 한다
- AC: 수정 모드에서는 "삭제" 버튼이 추가로 표시되어야 한다

**수용 기준 — 삭제**
- AC: "삭제" 버튼 클릭 시 ConfirmModal("이 공지사항을 삭제하시겠습니까?")이 표시되어야 한다
- AC: 삭제 성공 시 `/notices`로 이동하고 "삭제되었습니다" 토스트를 표시해야 한다

**API 매핑**
- 생성: `POST /api/admin/notices` → `NoticeCreateRequest`
- 조회: `GET /api/admin/notices/{noticeId}`
- 수정: `PUT /api/admin/notices/{noticeId}` → `NoticeUpdateRequest`
- 삭제: `DELETE /api/admin/notices/{noticeId}` (204 No Content)

---

### 5-11. 관리자 액션 로그 (`/action-logs`)

**사용자 스토리**
- As a 관리자, I want 관리자 액션 로그를 조회하고 싶다, so that 관리 이력을 감사(audit)할 수 있다.

**수용 기준**
- AC: 필터: adminUserId (숫자 입력), actionType (텍스트 입력 또는 셀렉트)
- AC: 액션 로그 테이블 컬럼: ID, 관리자ID(adminUserId), 액션 유형(actionType), 대상 유형(targetType), 대상 ID(targetId), 상세(detail), 생성일시(createdAt)
- AC: 읽기 전용 화면 — 생성/수정/삭제 버튼 없음
- AC: 페이지당 20개, 페이지네이션이 있어야 한다
- AC: detail이 null이면 "-"로 표시해야 한다

**API 매핑**
- `GET /api/admin/action-logs?adminUserId=&actionType=&page=0&size=20`

---

## 6. API 연동 명세

### 6-1. 인증 흐름

```
[로그인]
POST /api/admin/auth/login
→ AdminTokenResponse { accessToken, refreshToken, expiresIn }
→ accessToken: 모듈 변수 (메모리)
→ refreshToken: localStorage
→ scheduleTokenRefresh(expiresIn - 300) 타이머 설정

[인증 요청]
Authorization: Bearer {accessToken}

[401 발생 시]
→ 에러 코드 확인
→ DUPLICATE_LOGIN: DuplicateLoginModal 표시, refresh 없이 종료
→ 그 외: POST /api/admin/auth/refresh { refreshToken } 호출
  → 성공: 새 accessToken 저장, 원래 요청 1회 재시도
  → 실패: auth-expired CustomEvent 발행 → AuthContext가 로그아웃 처리 → /login 리다이렉트

[로그아웃]
POST /api/admin/auth/logout
→ accessToken 클리어
→ localStorage.removeItem('refreshToken')
→ /login 리다이렉트
```

### 6-2. API 클라이언트 파일 구조

```
src/api/
├── client.ts       # fetch 래퍼 (bodum-front-app 이식 + BASE_URL 조정)
├── auth.ts         # login, refresh, logout
├── users.ts        # getUsers, getUser, getUserPortfolio, getUserTrades, suspendUser
├── events.ts       # getEvents, getEvent, createEvent, updateEvent, deleteEvent
├── notices.ts      # getNotices, getNotice, createNotice, updateNotice, deleteNotice
└── actionLogs.ts   # getActionLogs
```

### 6-3. vite.config.ts 프록시 설정

```typescript
server: {
  proxy: {
    '/api/admin': {
      target: 'http://localhost:8083',
      changeOrigin: true,
    }
  }
}
```

### 6-4. 공통 에러 처리

| 에러 코드 | 처리 방식 |
|-----------|-----------|
| INVALID_CREDENTIALS | 로그인 폼 하단 인라인 메시지 |
| ACCOUNT_SUSPENDED | 로그인 폼 하단 인라인 메시지 |
| ACCOUNT_DELETED | 로그인 폼 하단 인라인 메시지 |
| DUPLICATE_LOGIN | DuplicateLoginModal 표시 |
| UNAUTHORIZED | auth-expired 이벤트 → 로그아웃 |
| INVALID_REFRESH_TOKEN | auth-expired 이벤트 → 로그아웃 |
| USER_NOT_FOUND | "사용자를 찾을 수 없습니다" 토스트(error) |
| USER_ALREADY_SUSPENDED | "이미 정지된 회원입니다" 토스트(error) |
| USER_DELETED | "삭제된 회원은 블락킹할 수 없습니다" 토스트(error) |
| EVENT_NOT_FOUND | "이벤트를 찾을 수 없습니다" 토스트(error) |
| INVALID_EVENT_DATE | "시작일은 종료일보다 이전이어야 합니다" 토스트(error) |
| NOTICE_NOT_FOUND | "공지사항을 찾을 수 없습니다" 토스트(error) |
| USER_CORE_ERROR | "User 서비스 호출에 실패했습니다" 토스트(error) |
| TRADE_CORE_ERROR | "Trading 서비스 호출에 실패했습니다" 토스트(error) |
| INVALID_REQUEST | "잘못된 요청입니다" 토스트(error) |
| 그 외 서버 에러 | "오류가 발생했습니다" 토스트(error) |

---

## 7. TypeScript 타입 정의

### 7-1. 파일 구조

```
src/types/
├── auth.ts         # AdminLoginRequest, AdminRefreshRequest, AdminTokenResponse
├── user.ts         # UserListResponse, UserDetailResponse, UserPortfolioResponse, UserTradeHistoryResponse, UserSuspendRequest
├── event.ts        # EventResponse, EventCreateRequest, EventUpdateRequest, EventStatus
├── notice.ts       # NoticeResponse, NoticeCreateRequest, NoticeUpdateRequest
├── actionLog.ts    # AdminActionLogResponse
└── common.ts       # PageResponse<T>, ApiResponse<T>
```

### 7-2. 공통 타입

```typescript
// common.ts
interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  message: string | null;
}

interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

type EventStatus = "UPCOMING" | "ONGOING" | "ENDED";
type AssetType = "CRYPTO" | "STOCK";
type TradeType = "BUY" | "SELL";
type TradeSource = "MANUAL" | "BOT";
type UserStatus = "ACTIVE" | "SUSPENDED" | "DELETED";
```

---

## 8. 프로젝트 디렉터리 구조 (TO-BE)

```
src/
├── api/
│   ├── client.ts
│   ├── auth.ts
│   ├── users.ts
│   ├── events.ts
│   ├── notices.ts
│   └── actionLogs.ts
├── components/
│   ├── layout/
│   │   ├── AdminLayout.tsx
│   │   ├── Sidebar.tsx
│   │   └── Header.tsx
│   └── common/
│       ├── Pagination.tsx
│       ├── ConfirmModal.tsx
│       ├── FormModal.tsx
│       ├── Toast.tsx
│       ├── LoadingSpinner.tsx
│       └── DuplicateLoginModal.tsx
├── context/
│   ├── AuthContext.tsx
│   ├── authContextDef.ts
│   └── ToastContext.tsx
├── hooks/
│   ├── useAuth.ts
│   └── useToast.ts
├── pages/
│   ├── LoginPage.tsx
│   ├── DashboardPage.tsx
│   ├── users/
│   │   ├── UserListPage.tsx
│   │   └── UserDetailPage.tsx     # 탭 포함 (정보/포트폴리오/거래내역)
│   ├── events/
│   │   ├── EventListPage.tsx
│   │   └── EventFormPage.tsx      # 생성/수정 통합
│   ├── notices/
│   │   ├── NoticeListPage.tsx
│   │   └── NoticeFormPage.tsx     # 생성/수정 통합
│   └── ActionLogPage.tsx
├── routes/
│   └── PrivateRoute.tsx
├── styles/
│   ├── base.css
│   ├── layout.css
│   ├── common.css
│   └── pages/
│       ├── login.css
│       ├── dashboard.css
│       ├── users.css
│       ├── events.css
│       ├── notices.css
│       └── action-logs.css
├── types/
│   ├── auth.ts
│   ├── user.ts
│   ├── event.ts
│   ├── notice.ts
│   ├── actionLog.ts
│   └── common.ts
└── utils/
    └── format.ts   # 날짜 포맷, 숫자 포맷, 한글 변환 유틸
```

---

## 9. 비기능 요구사항

| 항목 | 요구사항 | 근거 |
|------|---------|------|
| 반응형 | 최소 1024px 기준 — 이하는 수평 스크롤 허용 | 관리자 화면은 데스크톱 전용 |
| 접근성 | `<button>`, `<label>`, `<input>` 기본 시맨틱 준수, aria-label 필수 요소에 추가 | WCAG 2.1 Level A |
| 순수 CSS | UI 라이브러리 미사용 | bodum-front-app 일관성 유지 |
| 외부 의존성 | fetch API 사용 (axios 미사용) | bodum-front-app 패턴 준수 |
| TypeScript | strict: true, noUnusedLocals: true | 타입 안전성 보장 |
| 보안 | accessToken은 메모리에만 보관 | XSS 방어 |

---

## 10. 미결정 사항

| 항목 | 선택지 | 현재 판단 |
|------|-------|---------|
| 회원 정지 해제 | (A) 기능 없음 — Out of Scope / (B) 백엔드 API 추가 요청 | AS-IS에 API 없음. Out of Scope 처리하되, 추후 요구 시 백엔드와 협의 필요 |
| 대시보드 통계 | (A) 링크 허브만 / (B) 백엔드 통계 API 별도 구현 | 현재는 링크 허브로 구현. 백엔드에 통계 API 추가 시 확장 |
| actionType 필터 값 | 서버에서 제공하는 actionType enum 목록 불명확 | [가정] 자유 텍스트 입력으로 구현. 백엔드에서 enum 목록 제공 시 셀렉트박스로 변경 |
| 날짜 표시 포맷 | ISO 8601 그대로 / 한국어 포맷 (YYYY.MM.DD HH:mm) | [판단] 한국어 포맷으로 표시. `utils/format.ts`에서 일관 처리 |
| 이벤트/공지사항 상세 vs 수정 분리 | (A) 상세 보기 페이지 별도 / (B) 수정 폼이 상세 역할 통합 | 관리자 특성상 항상 수정 가능 상태로 통합. 상세 전용 뷰 불필요 |

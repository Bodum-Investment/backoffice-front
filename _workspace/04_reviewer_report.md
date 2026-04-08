# 코드 리뷰 보고서

작성일: 2026-04-08
프로젝트: backoffice-front (React 19 + TypeScript + Vite)
리뷰어: Reviewer Agent

---

## 요약

전반적으로 설계 문서를 충실히 구현했으며, API 경로·HTTP 메서드·파라미터 이름이 backoffice-core 컨트롤러와 거의 일치한다. 보안 설계(accessToken 메모리 보관, refresh 재시도 직렬화)도 올바르게 구현되었다. 다만 **CRITICAL 1건**(이벤트/공지사항 날짜 포맷 불일치로 인한 서버 파싱 오류), **HIGH 2건**(PortfolioDto 필드 불일치, AuthContext 초기 인증 경쟁 조건), **MEDIUM 3건**, **LOW 3건**이 발견되었다.

---

## CRITICAL

### [C-1] 이벤트 날짜 포맷 불일치 — 런타임 400 오류 발생 확실

**위치:** `src/pages/events/EventFormPage.tsx:61`, `src/api/events.ts:28-29`, `src/utils/format.ts:72-74`

**문제:**
`<input type="datetime-local" />`의 value는 `"2026-04-08T09:00"` 형태(초·타임존 없음)를 반환한다. 이 값을 그대로 페이로드에 담아 전송한다.

```typescript
// EventFormPage.tsx:61
const payload = { title, content, startAt, endAt, isActive };
```

```typescript
// format.ts:72-74
export function toDatetimeLocalValue(isoStr: string): string {
  return isoStr.slice(0, 16); // "2026-04-08T09:00" — 초·오프셋 없음
}
```

서버 측 `EventCreateRequest.startAt`의 타입은 `java.time.Instant`다. Spring Boot(Jackson)가 `Instant`를 역직렬화할 때 `"2026-04-08T09:00"` 포맷은 인식하지 못하고 **400 Bad Request**를 반환한다. Instant는 반드시 `"2026-04-08T09:00:00Z"`(ISO 8601 + UTC) 또는 epoch milliseconds여야 한다.

**수정 방법:**
```typescript
// format.ts에 추가
export function toInstantString(datetimeLocalValue: string): string {
  // datetime-local 값을 UTC ISO 문자열로 변환
  return new Date(datetimeLocalValue).toISOString(); // "2026-04-08T00:00:00.000Z"
}
```
```typescript
// EventFormPage.tsx handleSave() 수정
const payload = {
  title,
  content,
  startAt: toInstantString(startAt),
  endAt: toInstantString(endAt),
  isActive,
};
```

**주의:** `toDatetimeLocalValue()`는 역방향 변환(서버 Instant → input value)에 사용하는데, 서버가 `"2026-04-08T09:00:00Z"`를 반환할 때 `.slice(0,16)`하면 `"2026-04-08T09"` 같은 이상한 값이 나올 수 있다. 대신 `new Date(isoStr).toISOString().slice(0, 16)`를 사용해야 한다. 현재 코드에서는 서버가 Instant를 `"2026-04-08T09:00:00Z"` 형태로 내려주므로 `.slice(0,16)`은 `"2026-04-08T09"` — **T 다음에 "09:00"이 아니라 "09"만 잘린다.** 실제로는 `.slice(0,16)`이 `2026-04-08T09:00:00Z`에서 앞 16자 `2026-04-08T09:0`을 자르므로 입력 필드에 잘못된 값이 채워진다.

올바른 역방향 변환:
```typescript
export function toDatetimeLocalValue(isoStr: string): string {
  const d = new Date(isoStr);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
```

---

## HIGH

### [H-1] UserPortfolioResponse 타입 구조 불일치

**위치:** `src/types/user.ts:35-57` vs `TradeCoreClient.kt:90-119`

**문제:**
프론트엔드 `Portfolio` 타입은 `balance` 필드를 포함하나, 서버의 `PortfolioDto`에는 `balance`가 없다(balance는 `WalletDto`에만 있다).

```typescript
// src/types/user.ts - Portfolio 인터페이스
export interface Portfolio {
  balance: number;  // ← 서버 PortfolioDto에 없는 필드
  holdings: Holding[];
  totalEvaluation: number;
  ...
}
```

```kotlin
// TradeCoreClient.kt - PortfolioDto
data class PortfolioDto(
  // balance 없음
  val holdings: List<HoldingDto>,
  val totalEvaluation: BigDecimal,
  ...
)
```

`portfolio.wallet.balance`는 올바르게 참조하고 있으나(`UserDetailPage.tsx:194`), `Portfolio` 타입 정의 자체에 잘못된 `balance` 필드가 있어 TypeScript 타입 안전성을 해친다. 런타임 오류는 아니나, 코드 오해를 유발한다.

**수정:** `src/types/user.ts`의 `Portfolio` 인터페이스에서 `balance: number` 제거.

---

### [H-2] AuthContext 초기화 경쟁 조건 (Race Condition)

**위치:** `src/context/AuthContext.tsx:9-10`, `92-107`

**문제:**
`isAuthenticated`의 초기값을 `!!localStorage.getItem('refreshToken')`으로 설정해 refreshToken 존재 여부로 판단한다. 그런데 페이지 로드 직후 `useEffect`에서 실제 refresh API를 호출하기 전까지 잠깐 `isAuthenticated = true` 상태가 된다.

```typescript
// AuthContext.tsx:9-10
const [isAuthenticated, setIsAuthenticated] = useState<boolean>(
  () => !!localStorage.getItem('refreshToken'),  // ← refresh 유효성 미검증
);
```

이 상태에서 PrivateRoute는 즉시 보호된 페이지를 렌더링한다. 만료된 refreshToken이 localStorage에 남아 있으면 API 호출이 실패하고 그제서야 로그아웃 처리가 되지만, 그 사이 짧은 순간 보호 페이지가 노출된다.

**수정 방안:**
초기 상태를 `null`(로딩 중)로 두고, refresh 완료 후 true/false로 확정하는 패턴 사용:
```typescript
const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
// PrivateRoute에서 null일 때 로딩 스피너 표시
```

---

## MEDIUM

### [M-1] UserListPage — useEffect 무한 루프 위험

**위치:** `src/pages/users/UserListPage.tsx:41-49`

**문제:**
`useEffect` 의존성 배열에 `setSearchParams`가 포함되어 있다. `setSearchParams`는 react-router가 렌더마다 새 참조를 반환할 수 있어, 일부 버전에서 무한 루프를 유발한다. `useCallback`으로 안정화되지 않은 외부 함수가 deps에 들어간 경우 주의가 필요하다.

```typescript
// UserListPage.tsx:41-49
useEffect(() => {
  fetchUsers(page, filters);
  ...
  setSearchParams(params, { replace: true });
}, [page, filters, fetchUsers, setSearchParams]); // ← setSearchParams 위험
```

현재 react-router v7에서 `setSearchParams`가 안정적인 참조를 보장하는지 공식 문서에서 명확히 언급하지 않는다. 안전하게 `useRef`로 감싸거나 deps에서 제거(eslint-disable 주석 추가)하는 것을 권장한다.

---

### [M-2] 이벤트 폼 — 저장 중 삭제 버튼 비활성화 누락

**위치:** `src/pages/events/EventFormPage.tsx:162-164`

**문제:**
저장 중(`isLoading = true`)에도 삭제 버튼이 활성화 상태다. 저장 요청이 진행 중인 동안 삭제 버튼을 클릭하면 두 요청이 동시에 발생할 수 있다.

```typescript
// EventFormPage.tsx:162-164
{isEdit && (
  <button className="btn btn--danger" onClick={() => setShowDeleteModal(true)}>
    삭제  {/* disabled={isLoading} 누락 */}
  </button>
)}
```

**수정:**
```typescript
<button className="btn btn--danger" disabled={isLoading} onClick={() => setShowDeleteModal(true)}>
```

공지사항 폼(`NoticeFormPage.tsx:134-136`)도 동일한 문제가 있다.

---

### [M-3] toQueryString 중복 구현

**위치:** `src/api/users.ts:25-29`, `src/api/events.ts:11-15`, `src/api/actionLogs.ts:12-16`

**문제:**
동일한 `toQueryString` 함수가 세 파일에 각각 복사되어 있다. 동작은 동일하지만 유지보수 시 한 곳만 수정하면 일관성이 깨질 수 있다.

**수정:** `src/utils/queryString.ts` 또는 `src/api/client.ts`에 통합하여 import해서 사용.

---

## LOW

### [L-1] logout API 반환 타입 불일치

**위치:** `src/api/auth.ts:15-16`

**문제:**
서버 `AdminAuthController.logout()`은 `ApiResponse<String>`을 반환하나, 클라이언트는 `Promise<void>`로 선언되어 있다. `request<void>()`가 내부에서 `json.data as void`를 반환하므로 런타임 오류는 없지만, 타입이 정확하지 않다.

```typescript
// auth.ts:15-16
export const logout = (): Promise<void> =>
  request<void>('/api/admin/auth/logout', { method: 'POST' });
```

백오피스 특성상 logout 응답 data를 사용할 일이 없으므로 `Promise<void>`로 두는 것이 실용적이다. 의도적인 선택이라면 주석으로 명시하길 권장한다.

---

### [L-2] ActionLogPage — actionType 입력이 자유 텍스트

**위치:** `src/pages/ActionLogPage.tsx:63-70`

**문제:**
`actionType` 필터가 자유 텍스트 `<input>`으로 구현되어 있다. 서버에서 유효한 actionType 값이 enum으로 정의되어 있다면 `<select>`로 변경하는 것이 UX와 오입력 방지에 유리하다. 현재는 잘못된 값 입력 시 빈 결과만 반환되고 사용자에게 피드백이 없다.

---

### [L-3] Pagination — totalPages가 1일 때 null 반환

**위치:** `src/components/common/Pagination.tsx:12`

**문제:**
`if (totalPages <= 1) return null` 처리로 인해 총 1페이지일 때 페이지네이션이 사라진다. 데이터가 있지만 1페이지인 경우 사용자가 "페이지 정보"를 확인할 수 없다. UX 일관성을 위해 1페이지인 경우 페이지네이션 자체를 숨기는 것이 의도적 설계라면 설계 문서에 명시하길 권장한다.

---

## API 계약 검증 결과

| 도메인 | 메서드 | 경로 | 일치 여부 | 비고 |
|--------|--------|------|----------|------|
| Auth | POST | /api/admin/auth/login | ✅ | |
| Auth | POST | /api/admin/auth/refresh | ✅ | |
| Auth | POST | /api/admin/auth/logout | ✅ | |
| Users | GET | /api/admin/users | ✅ | |
| Users | GET | /api/admin/users/:userId | ✅ | |
| Users | GET | /api/admin/users/:userId/portfolio | ✅ | |
| Users | GET | /api/admin/users/:userId/trades | ✅ | |
| Users | PATCH | /api/admin/users/:userId/suspend | ✅ | |
| Events | GET | /api/admin/events | ✅ | |
| Events | POST | /api/admin/events | ✅ | 서버 201 반환, client는 200 기대 — Vite proxy가 status를 투명 전달하므로 문제없음 |
| Events | GET | /api/admin/events/:eventId | ✅ | |
| Events | PUT | /api/admin/events/:eventId | ✅ | |
| Events | DELETE | /api/admin/events/:eventId | ✅ | 서버 204, client 204 처리 ✅ |
| Notices | GET | /api/admin/notices | ✅ | |
| Notices | POST | /api/admin/notices | ✅ | |
| Notices | GET | /api/admin/notices/:noticeId | ✅ | |
| Notices | PUT | /api/admin/notices/:noticeId | ✅ | |
| Notices | DELETE | /api/admin/notices/:noticeId | ✅ | |
| ActionLogs | GET | /api/admin/action-logs | ✅ | |
| **이벤트 날짜 파라미터** | POST/PUT | startAt, endAt | ❌ | **[C-1]** datetime-local 포맷 → Instant 파싱 실패 |

---

## 보안 체크리스트 결과

| 항목 | 결과 | 비고 |
|------|------|------|
| accessToken 메모리 저장 (XSS 방어) | ✅ | `let accessToken: string \| null` — localStorage 미사용 |
| refreshToken localStorage 저장 | 허용 | HttpOnly 쿠키가 이상적이나, 백오피스 특성상 허용 수준 |
| 401 refresh 무한 루프 방지 | ✅ | `_retry` 플래그로 1회만 재시도 |
| refresh 동시 요청 직렬화 | ✅ | `isRefreshing` + `refreshPromise` 패턴 |
| 중복 로그인 감지 | ✅ | `DUPLICATE_LOGIN` 코드 및 메시지 이중 체크 |
| PrivateRoute 인증 가드 | ✅ | `isAuthenticated` false 시 /login 리다이렉트 |
| 비밀번호 autocomplete | ✅ | `autoComplete="current-password"` |
| XSS (innerHTML 없음) | ✅ | 모든 데이터 JSX 텍스트로 렌더링 |

---

## 종합 평가

- **설계 충실도:** 높음. 42개 파일 전부 설계 명세대로 구현.
- **API 계약:** 날짜 포맷([C-1]) 외 전 엔드포인트 일치.
- **보안:** accessToken 메모리 보관, refresh 직렬화 등 핵심 패턴 올바르게 구현.
- **코드 품질:** useCallback/useEffect cleanup 전반적으로 양호. 중복 코드(toQueryString) 및 경쟁 조건([H-2]) 개선 필요.

**[C-1] 이벤트 날짜 포맷 불일치는 배포 전 반드시 수정해야 한다.**

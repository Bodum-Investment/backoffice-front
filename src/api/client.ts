const BASE_URL = '';

// accessToken과 refreshToken 모두 메모리에만 보관 (XSS 방어)
let accessToken: string | null = null;
let refreshToken: string | null = null;

export function setAccessToken(token: string | null): void {
  accessToken = token;
}

export function getAccessToken(): string | null {
  return accessToken;
}

export function setRefreshToken(token: string | null): void {
  refreshToken = token;
}

export function getRefreshToken(): string | null {
  return refreshToken;
}

let isRefreshing = false;
let refreshPromise: Promise<string | null> | null = null;

async function tryRefreshToken(): Promise<string | null> {
  const storedRefresh = refreshToken;
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
        setRefreshToken(json.data.refreshToken);
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
  setRefreshToken(null);
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
      setRefreshToken(null);
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

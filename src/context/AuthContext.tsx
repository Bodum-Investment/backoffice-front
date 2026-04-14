import { useState, useRef, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import * as authApi from '../api/auth';
import { setAccessToken, getRefreshToken, setRefreshToken } from '../api/client';
import type { AdminTokenResponse } from '@/types/auth';
import { AuthContext } from './authContextDef';

export function AuthProvider({ children }: { children: ReactNode }) {
  const hasStoredRefresh = !!getRefreshToken();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(hasStoredRefresh);
  const [showDuplicateLoginModal, setShowDuplicateLoginModal] = useState(false);
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearRefreshTimer = useCallback(() => {
    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current);
      refreshTimerRef.current = null;
    }
  }, []);

  const clearAuth = useCallback(() => {
    setAccessToken(null);
    setRefreshToken(null);
    setIsAuthenticated(false);
    clearRefreshTimer();
  }, [clearRefreshTimer]);

  const handleLogout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      /* 실패해도 로컬 정리 */
    }
    clearAuth();
  }, [clearAuth]);

  const scheduleTokenRefresh = useCallback((expiresInSeconds: number) => {
    const refreshTime = Math.max((expiresInSeconds - 300) * 1000, 10000);
    clearRefreshTimer();
    refreshTimerRef.current = setTimeout(async () => {
      const storedRefresh = getRefreshToken();
      if (!storedRefresh) return;
      try {
        const res = await authApi.refreshToken(storedRefresh);
        setAccessToken(res.accessToken);
        setRefreshToken(res.refreshToken);
        scheduleTokenRefresh(res.expiresIn);
      } catch {
        handleLogout();
      }
    }, refreshTime);
  }, [clearRefreshTimer, handleLogout]);

  const login = useCallback(async (email: string, password: string): Promise<AdminTokenResponse> => {
    const data = await authApi.login({ email, password });
    setAccessToken(data.accessToken);
    setRefreshToken(data.refreshToken);
    setIsAuthenticated(true);
    scheduleTokenRefresh(data.expiresIn);
    return data;
  }, [scheduleTokenRefresh]);

  const logout = useCallback(() => {
    handleLogout();
  }, [handleLogout]);

  const closeDuplicateLoginModal = useCallback(() => {
    setShowDuplicateLoginModal(false);
    clearAuth();
  }, [clearAuth]);

  // 중복 로그인 감지
  useEffect(() => {
    const handler = () => {
      setShowDuplicateLoginModal(true);
      clearAuth();
    };
    window.addEventListener('duplicate-login', handler);
    return () => window.removeEventListener('duplicate-login', handler);
  }, [clearAuth]);

  // auth-expired 이벤트 리스너
  useEffect(() => {
    const handleAuthExpired = () => {
      clearAuth();
    };
    window.addEventListener('auth-expired', handleAuthExpired);
    return () => window.removeEventListener('auth-expired', handleAuthExpired);
  }, [clearAuth]);

  // 페이지 로드 시: refreshToken이 있으면 accessToken 재발급
  useEffect(() => {
    const storedRefresh = getRefreshToken();
    if (storedRefresh) {
      authApi.refreshToken(storedRefresh)
        .then((res) => {
          setAccessToken(res.accessToken);
          setRefreshToken(res.refreshToken);
          setIsAuthenticated(true);
          scheduleTokenRefresh(res.expiresIn);
        })
        .catch(() => {
          clearAuth();
        })
        .finally(() => {
          setIsAuthLoading(false);
        });
    }
    return () => clearRefreshTimer();
  }, [scheduleTokenRefresh, clearAuth, clearRefreshTimer]);

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        isAuthLoading,
        login,
        logout,
        showDuplicateLoginModal,
        closeDuplicateLoginModal,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

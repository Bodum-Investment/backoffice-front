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

import { createContext } from 'react';
import type { AdminTokenResponse } from '@/types/auth';

export interface AuthContextValue {
  isAuthenticated: boolean;
  isAuthLoading: boolean;
  login: (email: string, password: string) => Promise<AdminTokenResponse>;
  logout: () => void;
  showDuplicateLoginModal: boolean;
  closeDuplicateLoginModal: () => void;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

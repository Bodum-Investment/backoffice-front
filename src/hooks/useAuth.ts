import { useContext } from 'react';
import { AuthContext } from '@/context/authContextDef';
import type { AuthContextValue } from '@/context/authContextDef';

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}

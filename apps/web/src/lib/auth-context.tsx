'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import { useRouter } from 'next/navigation';
import { api, clearTokens, getTokens, setTokens } from './api-client';
import type { AuthUser, Role } from '@/types';

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  login: (identifier: string, password: string) => Promise<AuthUser>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const USER_KEY = 'pcls_user';

export const ROLE_HOME: Record<Role, string> = {
  STUDENT: '/student/dashboard',
  PARENT: '/parent/dashboard',
  SECURITY: '/security/scan',
  STAFF: '/staff/dashboard',
  ADMIN: '/admin/dashboard',
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const { accessToken } = getTokens();
    const stored = typeof window !== 'undefined' ? localStorage.getItem(USER_KEY) : null;
    if (accessToken && stored) {
      setUser(JSON.parse(stored));
    }
    setLoading(false);
  }, []);

  const login = useCallback(async (identifier: string, password: string) => {
    const data = await api.post<{
      accessToken: string;
      refreshToken: string;
      user: AuthUser;
    }>('/auth/login', { identifier, password }, { skipAuth: true });
    setTokens(data.accessToken, data.refreshToken);
    localStorage.setItem(USER_KEY, JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  }, []);

  const logout = useCallback(async () => {
    const { refreshToken } = getTokens();
    try {
      if (refreshToken) await api.post('/auth/logout', { refreshToken });
    } catch {
      // ignore network errors on logout
    }
    clearTokens();
    localStorage.removeItem(USER_KEY);
    setUser(null);
    router.push('/login');
  }, [router]);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import * as SecureStore from 'expo-secure-store';
import { api, clearTokens, getTokens, setTokens } from './api';
import { registerForPushNotifications } from './notifications';
import type { AuthUser } from '@/types';

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  login: (identifier: string, password: string) => Promise<AuthUser>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);
const USER_KEY = 'pcls_user';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { accessToken } = await getTokens();
      const stored = await SecureStore.getItemAsync(USER_KEY);
      if (accessToken && stored) setUser(JSON.parse(stored));
      setLoading(false);
    })();
  }, []);

  const login = useCallback(async (identifier: string, password: string) => {
    const data = await api.post<{ accessToken: string; refreshToken: string; user: AuthUser }>(
      '/auth/login',
      { identifier, password },
      { skipAuth: true },
    );
    await setTokens(data.accessToken, data.refreshToken);
    await SecureStore.setItemAsync(USER_KEY, JSON.stringify(data.user));
    setUser(data.user);

    // Fire-and-forget: register this device for push notifications now that
    // we're authenticated (the endpoint requires a bearer token).
    registerForPushNotifications().catch(() => undefined);

    return data.user;
  }, []);

  const logout = useCallback(async () => {
    const { refreshToken } = await getTokens();
    try {
      if (refreshToken) await api.post('/auth/logout', { refreshToken });
    } catch {
      // ignore
    }
    await clearTokens();
    await SecureStore.deleteItemAsync(USER_KEY);
    setUser(null);
  }, []);

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

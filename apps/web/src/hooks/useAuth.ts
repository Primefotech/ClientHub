'use client';

import { useState, useEffect, useCallback } from 'react';
import { User } from '@/types';
import { getUser, setAuth, clearAuth } from '@/lib/auth';
import { authApi } from '@/lib/api';

export function useAuth() {
  // Start with the stored user immediately to avoid flicker
  const [user, setUser] = useState<User | null>(() => {
    if (typeof window === 'undefined') return null;
    return getUser();
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('bb_token') : null;

    if (!token) {
      console.log('[useAuth] No token found, skipping /me check');
      setLoading(false);
      return;
    }

    // Sync cookie for middleware if missing
    if (!document.cookie.includes('bb_token=')) {
      console.log('[useAuth] Cookie missing, syncing from localStorage');
      document.cookie = `bb_token=${token}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`;
    }

    console.log('[useAuth] Token found, verifying with /auth/me...');
    authApi
      .me()
      .then((fresh) => {
        console.log('[useAuth] /auth/me success:', fresh?.email);
        setUser(fresh);
        localStorage.setItem('bb_user', JSON.stringify(fresh));
      })
      .catch((err) => {
        console.error('[useAuth] /auth/me failed:', err?.response?.status, err?.message);
        clearAuth();
        setUser(null);
        // Use hard redirect so middleware cookie check works
        window.location.href = '/login';
      })
      .finally(() => {
        setLoading(false);
      });
  // Only run once on mount
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    console.log('[useAuth] Attempting login for:', email);
    try {
      const data = await authApi.login(email, password);
      console.log('[useAuth] Login API success, token received');
      setAuth(data.token, data.user);
      setUser(data.user);
      console.log('[useAuth] Auth state set, cookie written');
      return data.user;
    } catch (err: any) {
      console.error('[useAuth] Login failed:', err?.response?.status, err?.response?.data, err?.message);
      throw err;
    }
  }, []);

  const logout = useCallback(() => {
    console.log('[useAuth] Logging out');
    clearAuth();
    setUser(null);
    window.location.href = '/login';
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const fresh = await authApi.me();
      setUser(fresh);
      localStorage.setItem('bb_user', JSON.stringify(fresh));
      return fresh;
    } catch (err) {
      console.error('[useAuth] refreshUser failed:', err);
      logout();
    }
  }, [logout]);

  return { user, loading, login, logout, refreshUser };
}

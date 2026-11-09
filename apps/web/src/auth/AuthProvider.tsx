import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import {
  apiClient,
  isMockApi,
  type LoginRequest,
  type RegisterRequest,
  type UserResponse,
} from '../services/apiClient';
import { AuthContext, type AuthContextValue, type AuthStatus } from './context';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>(() =>
    isMockApi() ? 'unauthenticated' : 'loading'
  );
  const [user, setUser] = useState<UserResponse | null>(null);

  useEffect(() => {
    let active = true;

    apiClient.setUnauthorizedHandler(() => {
      if (active) {
        setUser(null);
        setStatus('unauthenticated');
      }
    });

    if (!isMockApi()) {
      void (async () => {
        try {
          // The access token lives in memory only, so a page reload recovers
          // the session by rotating the HttpOnly refresh cookie.
          await apiClient.refresh();
          const me = await apiClient.getMe();
          if (!active) {
            return;
          }
          setUser(me);
          setStatus('authenticated');
        } catch {
          if (!active) {
            return;
          }
          setUser(null);
          setStatus('unauthenticated');
        }
      })();
    }

    return () => {
      active = false;
      apiClient.setUnauthorizedHandler(null);
    };
  }, []);

  const login = useCallback(async (credentials: LoginRequest) => {
    try {
      await apiClient.login(credentials);
      const me = await apiClient.getMe();
      setUser(me);
      setStatus('authenticated');
      return me;
    } catch (error) {
      apiClient.setAccessToken(null);
      setUser(null);
      setStatus('unauthenticated');
      throw error;
    }
  }, []);

  const register = useCallback(async (payload: RegisterRequest) => {
    try {
      await apiClient.register(payload);
      // Registration does not issue tokens, so sign in immediately.
      await apiClient.login({ email: payload.email, password: payload.password });
      const me = await apiClient.getMe();
      setUser(me);
      setStatus('authenticated');
      return me;
    } catch (error) {
      apiClient.setAccessToken(null);
      setUser(null);
      setStatus('unauthenticated');
      throw error;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await apiClient.logout();
    } catch {
      // Clear the local session even if the server call fails; the refresh
      // cookie is HttpOnly and cannot be cleared from JavaScript.
    } finally {
      setUser(null);
      setStatus('unauthenticated');
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ status, user, login, register, logout }),
    [status, user, login, register, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

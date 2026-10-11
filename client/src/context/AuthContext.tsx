import { createContext, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useToast } from '../hooks/useToast';
import { authApi } from '../services/api/auth.api';
import { AUTH_EXPIRED_EVENT } from '../services/api/axiosInstance';
import type { LoginPayload, Permission, RegisterPayload, User } from '../types/auth';
import { tokenStorage } from '../utils/tokenStorage';

export interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  login: (payload: LoginPayload) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => Promise<void>;
  hasPermission: (permission: Permission) => boolean;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const toast = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(() => tokenStorage.get() !== null);
  const wasSignedIn = useRef(false);

  useEffect(() => {
    wasSignedIn.current = user !== null;
  }, [user]);

  useEffect(() => {
    if (!tokenStorage.get()) return;
    let active = true;
    authApi
      .getMe()
      .then((me) => active && setUser(me))
      .catch(() => tokenStorage.clear())
      .finally(() => active && setIsLoading(false));
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const onExpired = () => {
      if (wasSignedIn.current) toast.info('Your session has expired. Please sign in again.');
      setUser(null);
    };
    window.addEventListener(AUTH_EXPIRED_EVENT, onExpired);
    return () => window.removeEventListener(AUTH_EXPIRED_EVENT, onExpired);
  }, [toast]);

  const completeSignIn = useCallback(async (promise: ReturnType<typeof authApi.login>) => {
    const { token, user: signedIn } = await promise;
    tokenStorage.set(token);
    setUser(signedIn);
  }, []);

  const login = useCallback((payload: LoginPayload) => completeSignIn(authApi.login(payload)), [completeSignIn]);
  const register = useCallback((payload: RegisterPayload) => completeSignIn(authApi.register(payload)), [completeSignIn]);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {}
    tokenStorage.clear();
    setUser(null);
  }, []);

  const hasPermission = useCallback((permission: Permission) => !!user?.permissions.includes(permission), [user]);

  const value = useMemo(
    () => ({ user, isLoading, login, register, logout, hasPermission }),
    [user, isLoading, login, register, logout, hasPermission],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

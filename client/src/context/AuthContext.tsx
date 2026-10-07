import { createContext, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useToast } from '../hooks/useToast';
import { authApi } from '../services/api/auth.api';
import { AUTH_EXPIRED_EVENT } from '../services/api/axiosInstance';
import type { LoginPayload, Permission, RegisterPayload, User } from '../types/auth';
import { tokenStorage } from '../utils/tokenStorage';

export interface AuthContextValue {
  user: User | null;
  /** True while a stored token is being validated on first load. */
  isLoading: boolean;
  login: (payload: LoginPayload) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => Promise<void>;
  /** UI visibility only. The backend is the actual security boundary. */
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

  // Restore the session from a stored token.
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

  // Raised by the Axios interceptor when the API answers 401 (expired/revoked token).
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
    } catch {
      /* the token is discarded locally either way */
    }
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

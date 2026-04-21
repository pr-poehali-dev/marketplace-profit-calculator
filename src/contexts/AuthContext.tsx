import { createContext, useCallback, useContext, useEffect, useMemo, useState, ReactNode } from 'react';
import { useYandexAuth, User } from '@/components/extensions/yandex-auth/useYandexAuth';
import { setWbAuthHeaderProvider } from '@/lib/wbApi';

const AUTH_URL = 'https://functions.poehali.dev/2e056aab-4184-456d-8c5a-84a93c8371be';
const WB_API_URL = 'https://functions.poehali.dev/a64253f4-7852-4f3b-9c5a-03b2369b9296';

const EMAIL_TOKEN_KEY = 'finplace_email_token';
const EMAIL_USER_KEY = 'finplace_email_user';

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  accessToken: string | null;
  loginYandex: () => Promise<void>;
  loginEmail: (email: string, password: string) => Promise<void>;
  registerEmail: (email: string, password: string, name?: string) => Promise<void>;
  logout: () => Promise<void>;
  getAuthHeader: () => Record<string, string>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const yandex = useYandexAuth({
    apiUrls: {
      authUrl: `${AUTH_URL}?action=auth-url`,
      callback: `${AUTH_URL}?action=callback`,
      refresh: `${AUTH_URL}?action=refresh`,
      logout: `${AUTH_URL}?action=logout`,
    },
  });

  const [emailToken, setEmailToken] = useState<string | null>(() => localStorage.getItem(EMAIL_TOKEN_KEY));
  const [emailUser, setEmailUser] = useState<User | null>(() => {
    const raw = localStorage.getItem(EMAIL_USER_KEY);
    if (!raw) return null;
    try { return JSON.parse(raw) as User; } catch { return null; }
  });

  const accessToken = yandex.accessToken || emailToken;
  const user = yandex.user || emailUser;
  const isAuthenticated = !!accessToken;

  const getAuthHeader = useCallback((): Record<string, string> => {
    return accessToken ? { Authorization: `Bearer ${accessToken}` } : {};
  }, [accessToken]);

  useEffect(() => {
    setWbAuthHeaderProvider(getAuthHeader);
  }, [getAuthHeader]);

  const loginEmail = async (email: string, password: string) => {
    const res = await fetch(`${WB_API_URL}?action=email-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Ошибка входа');
    localStorage.setItem(EMAIL_TOKEN_KEY, data.access_token);
    localStorage.setItem(EMAIL_USER_KEY, JSON.stringify(data.user));
    setEmailToken(data.access_token);
    setEmailUser(data.user);
  };

  const registerEmail = async (email: string, password: string, name?: string) => {
    const res = await fetch(`${WB_API_URL}?action=email-register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Ошибка регистрации');
    localStorage.setItem(EMAIL_TOKEN_KEY, data.access_token);
    localStorage.setItem(EMAIL_USER_KEY, JSON.stringify(data.user));
    setEmailToken(data.access_token);
    setEmailUser(data.user);
  };

  const logout = async () => {
    localStorage.removeItem(EMAIL_TOKEN_KEY);
    localStorage.removeItem(EMAIL_USER_KEY);
    setEmailToken(null);
    setEmailUser(null);
    if (yandex.isAuthenticated) await yandex.logout();
  };

  const value = useMemo<AuthContextValue>(() => ({
    user,
    isAuthenticated,
    isLoading: yandex.isLoading,
    accessToken,
    loginYandex: yandex.login,
    loginEmail,
    registerEmail,
    logout,
    getAuthHeader,
  }), [user, isAuthenticated, yandex.isLoading, accessToken, yandex.login, getAuthHeader]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}

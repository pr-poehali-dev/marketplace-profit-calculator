import { createContext, useContext, ReactNode } from 'react';
import { useTelegramAuth } from '@/components/extensions/telegram-bot/useTelegramAuth';

interface User {
  id: number;
  email: string | null;
  name: string | null;
  avatar_url: string | null;
  telegram_id: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  accessToken: string | null;
  login: () => void;
  handleCallback: (token: string) => Promise<boolean>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<boolean>;
  getAuthHeader: () => { Authorization: string } | {};
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const auth = useTelegramAuth({
    apiUrls: {
      callback: 'https://functions.poehali.dev/09d1ba5e-b952-48a0-b05a-16eb26d046e6?action=callback',
      refresh: 'https://functions.poehali.dev/09d1ba5e-b952-48a0-b05a-16eb26d046e6?action=refresh',
      logout: 'https://functions.poehali.dev/09d1ba5e-b952-48a0-b05a-16eb26d046e6?action=logout',
    },
    botUsername: 'FinPlace_2087_bot',
  });

  return (
    <AuthContext.Provider value={auth}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

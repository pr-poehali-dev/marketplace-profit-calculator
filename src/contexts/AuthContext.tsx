import { createContext, useContext, ReactNode } from 'react';

interface User {
  id: number;
  email: string | null;
  name: string | null;
  avatar_url: string | null;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  accessToken: string | null;
  login: () => void;
  logout: () => Promise<void>;
  getAuthHeader: () => object;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const auth: AuthContextType = {
    user: null,
    isAuthenticated: true,
    isLoading: false,
    error: null,
    accessToken: null,
    login: () => {},
    logout: async () => {},
    getAuthHeader: () => ({}),
  };

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
// Deprecated shim — используйте useAuth из @/contexts/AuthContext.
// Оставлено для совместимости с ранее написанным кодом.
import { useAuth } from '@/contexts/AuthContext';

export function useWbAuth() {
  const a = useAuth();
  return {
    user: a.user,
    isAuthenticated: a.isAuthenticated,
    isLoading: a.isLoading,
    accessToken: a.accessToken,
    login: a.loginYandex,
    logout: a.logout,
    getAuthHeader: a.getAuthHeader,
  };
}

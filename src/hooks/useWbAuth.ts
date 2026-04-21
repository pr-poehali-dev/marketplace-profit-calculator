import { useEffect, useMemo } from 'react';
import { useYandexAuth } from '@/components/extensions/yandex-auth/useYandexAuth';
import { setWbAuthHeaderProvider } from '@/lib/wbApi';

const AUTH_URL = 'https://functions.poehali.dev/2e056aab-4184-456d-8c5a-84a93c8371be';

export function useWbAuth() {
  const auth = useYandexAuth({
    apiUrls: {
      authUrl: `${AUTH_URL}?action=auth-url`,
      callback: `${AUTH_URL}?action=callback`,
      refresh: `${AUTH_URL}?action=refresh`,
      logout: `${AUTH_URL}?action=logout`,
    },
  });

  const getAuthHeader = useMemo(() => auth.getAuthHeader, [auth.getAuthHeader]);

  useEffect(() => {
    setWbAuthHeaderProvider(() => (getAuthHeader() as Record<string, string>) || {});
  }, [getAuthHeader, auth.accessToken]);

  return auth;
}

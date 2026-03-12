import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useYandexAuth } from '@/components/extensions/yandex-auth/useYandexAuth';
import Icon from '@/components/ui/icon';

const AUTH_URL = 'https://functions.poehali.dev/2e056aab-4184-456d-8c5a-84a93c8371be';

const YandexCallback = () => {
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const auth = useYandexAuth({
    apiUrls: {
      authUrl: `${AUTH_URL}?action=auth-url`,
      callback: `${AUTH_URL}?action=callback`,
      refresh: `${AUTH_URL}?action=refresh`,
      logout: `${AUTH_URL}?action=logout`,
    },
  });

  useEffect(() => {
    const process = async () => {
      const success = await auth.handleCallback();
      if (success) {
        setStatus('success');
        setTimeout(() => navigate('/'), 1500);
      } else {
        setStatus('error');
        setTimeout(() => navigate('/'), 3000);
      }
    };
    process();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4">
        {status === 'loading' && (
          <>
            <Icon name="Loader2" size={48} className="mx-auto animate-spin text-primary" />
            <p className="text-lg">Выполняем вход...</p>
          </>
        )}
        {status === 'success' && (
          <>
            <Icon name="CheckCircle" size={48} className="mx-auto text-green-500" />
            <p className="text-lg text-green-600">Вход выполнен! Перенаправляем...</p>
          </>
        )}
        {status === 'error' && (
          <>
            <Icon name="XCircle" size={48} className="mx-auto text-red-500" />
            <p className="text-lg text-red-600">Ошибка авторизации. Перенаправляем...</p>
          </>
        )}
      </div>
    </div>
  );
};

export default YandexCallback;

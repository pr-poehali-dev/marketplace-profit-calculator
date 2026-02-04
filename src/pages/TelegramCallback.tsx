import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import { useTelegramAuth } from '@/components/extensions/telegram-bot/useTelegramAuth';

const TelegramCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [errorMessage, setErrorMessage] = useState('');

  const auth = useTelegramAuth({
    apiUrls: {
      callback: 'https://functions.poehali.dev/09d1ba5e-b952-48a0-b05a-16eb26d046e6?action=callback',
      refresh: 'https://functions.poehali.dev/09d1ba5e-b952-48a0-b05a-16eb26d046e6?action=refresh',
      logout: 'https://functions.poehali.dev/09d1ba5e-b952-48a0-b05a-16eb26d046e6?action=logout',
    },
    botUsername: 'unit_ekonomika_bot',
  });

  useEffect(() => {
    const token = searchParams.get('token');
    
    if (!token) {
      setStatus('error');
      setErrorMessage('Токен не найден');
      return;
    }

    const processCallback = async () => {
      try {
        const success = await auth.handleCallback(token);
        if (success) {
          setStatus('success');
          setTimeout(() => navigate('/'), 1500);
        } else {
          setStatus('error');
          setErrorMessage(auth.error || 'Ошибка авторизации');
        }
      } catch (err) {
        setStatus('error');
        setErrorMessage('Произошла ошибка при авторизации');
      }
    };

    processCallback();
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8">
        <div className="text-center">
          {status === 'processing' && (
            <>
              <div className="animate-spin mx-auto mb-4">
                <Icon name="Loader2" size={48} className="text-primary" />
              </div>
              <h2 className="text-xl font-semibold mb-2">Авторизация...</h2>
              <p className="text-muted-foreground">Проверяем ваши данные</p>
            </>
          )}

          {status === 'success' && (
            <>
              <Icon name="CheckCircle" size={48} className="text-green-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Успешно!</h2>
              <p className="text-muted-foreground">Перенаправляем на главную...</p>
            </>
          )}

          {status === 'error' && (
            <>
              <Icon name="XCircle" size={48} className="text-destructive mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Ошибка</h2>
              <p className="text-muted-foreground mb-4">{errorMessage}</p>
              <button
                onClick={() => navigate('/login')}
                className="text-primary hover:underline"
              >
                Попробовать снова
              </button>
            </>
          )}
        </div>
      </Card>
    </div>
  );
};

export default TelegramCallback;

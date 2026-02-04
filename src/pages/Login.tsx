import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import { TelegramLoginButton } from '@/components/extensions/telegram-bot/TelegramLoginButton';
import { useTelegramAuth } from '@/components/extensions/telegram-bot/useTelegramAuth';

const Login = () => {
  const navigate = useNavigate();
  
  const auth = useTelegramAuth({
    apiUrls: {
      callback: 'https://functions.poehali.dev/09d1ba5e-b952-48a0-b05a-16eb26d046e6?action=callback',
      refresh: 'https://functions.poehali.dev/09d1ba5e-b952-48a0-b05a-16eb26d046e6?action=refresh',
      logout: 'https://functions.poehali.dev/09d1ba5e-b952-48a0-b05a-16eb26d046e6?action=logout',
    },
    botUsername: 'unit_ekonomika_bot',
  });

  useEffect(() => {
    if (auth.isAuthenticated) {
      navigate('/');
    }
  }, [auth.isAuthenticated, navigate]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Icon name="TrendingUp" size={48} className="text-primary" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Unit Экономика</h1>
          <p className="text-muted-foreground">
            Сервис для селлеров маркетплейсов
          </p>
        </div>

        <div className="space-y-4">
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-4">
              Для доступа к калькулятору авторизуйтесь через Telegram
            </p>
            <TelegramLoginButton
              onClick={auth.login}
              isLoading={auth.isLoading}
              className="w-full"
            />
          </div>

          {auth.error && (
            <div className="p-3 bg-destructive/10 text-destructive rounded-md text-sm text-center">
              {auth.error}
            </div>
          )}
        </div>

        <div className="mt-8 pt-6 border-t text-center text-sm text-muted-foreground">
          <p>После нажатия кнопки откроется Telegram бот.</p>
          <p className="mt-1">Следуйте инструкциям в боте для входа.</p>
        </div>
      </Card>
    </div>
  );
};

export default Login;

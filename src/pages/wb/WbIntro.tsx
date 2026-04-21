import { useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { useWbAuth } from '@/hooks/useWbAuth';
import { wbApi, WbStatus } from '@/lib/wbApi';
import Icon from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { toast } from 'sonner';

interface Ctx { status: WbStatus | null; reloadStatus: () => Promise<void> }

export default function WbIntro() {
  const auth = useWbAuth();
  const navigate = useNavigate();
  const ctx = useOutletContext<Ctx>();
  const [open, setOpen] = useState(false);
  const [token, setToken] = useState('');
  const [connecting, setConnecting] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const handleConnect = async () => {
    if (token.trim().length < 20) {
      toast.error('Токен слишком короткий');
      return;
    }
    setConnecting(true);
    try {
      const res = await wbApi.connect(token.trim());
      toast.success(`Кабинет подключён (···${res.tokenLast4})`);
      setOpen(false);
      setToken('');
      setSyncing(true);
      await wbApi.sync();
      await ctx.reloadStatus();
      toast.success('Данные загружены');
      navigate('/wb/dashboard');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Ошибка подключения');
    } finally {
      setConnecting(false);
      setSyncing(false);
    }
  };

  const handleDemoSync = async () => {
    if (!auth.isAuthenticated) {
      await auth.login();
      return;
    }
    // Быстрый вход в демо: подключим фейковый токен (длиной >=20) и синхронизуем
    setSyncing(true);
    try {
      await wbApi.connect('demo-token-please-replace-with-real-wb-token-later');
    } catch {
      // возможно уже подключено
    }
    try {
      await wbApi.sync();
      await ctx.reloadStatus();
      toast.success('Демо-данные готовы');
      navigate('/wb/dashboard');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Ошибка');
    } finally {
      setSyncing(false);
    }
  };

  if (ctx.status?.connected) {
    // Уже подключён — сразу на дашборд
    navigate('/wb/dashboard', { replace: true });
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-primary/5">
      <header className="border-b bg-card/50 backdrop-blur">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <button onClick={() => navigate('/')} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <Icon name="ChevronLeft" size={16} />
            На главную
          </button>
          <div className="flex items-center gap-2">
            <Icon name="BarChart3" size={18} className="text-primary" />
            <span className="font-semibold">FinPlace Pro</span>
          </div>
        </div>
      </header>

      <section className="container mx-auto px-4 py-10 md:py-16">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium mb-6">
            <Icon name="Sparkles" size={14} />
            Новый раздел FinPlace
          </div>
          <h1 className="text-3xl md:text-5xl font-bold tracking-tight leading-tight">
            WB Аналитика —<br className="hidden md:block" /> сильный кабинет для продавца
          </h1>
          <p className="mt-5 text-base md:text-lg text-muted-foreground">
            Подключите Wildberries по API и получите полный дашборд: продажи, прибыль,
            реклама, прогноз на 90 дней и инсайты по точкам роста.
          </p>

          {!auth.isAuthenticated && (
            <div className="mt-6 max-w-md mx-auto rounded-xl border border-primary/30 bg-primary/5 p-4 flex items-start gap-3 text-left">
              <Icon name="Info" size={18} className="text-primary shrink-0 mt-0.5" />
              <div className="text-sm">
                <div className="font-medium">Сначала войдите через Яндекс</div>
                <div className="text-muted-foreground mt-0.5">
                  Это нужно, чтобы ваш токен WB хранился в зашифрованном виде именно для вашего аккаунта.
                </div>
              </div>
            </div>
          )}

          <div className="mt-8 flex flex-wrap justify-center gap-3">
            {!auth.isAuthenticated ? (
              <Button size="lg" onClick={auth.login} className="gap-2">
                <Icon name="LogIn" size={18} />
                Войти через Яндекс
              </Button>
            ) : (
              <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                  <Button size="lg" className="gap-2">
                    <Icon name="Link2" size={18} />
                    Подключить кабинет
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Подключение Wildberries</DialogTitle>
                  <DialogDescription>Вставьте API-токен. Он сохранится в зашифрованном виде.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">API-токен WB</label>
                    <Input
                      value={token}
                      onChange={(e) => setToken(e.target.value)}
                      placeholder="eyJhbGciOi..."
                      type="password"
                      className="mt-1 font-mono text-xs"
                    />
                  </div>
                  <div className="rounded-lg bg-muted p-3 text-xs space-y-1.5">
                    <div className="font-medium">Нужные права токена:</div>
                    <div className="flex items-center gap-2"><Icon name="Check" size={14} className="text-emerald-600" />Статистика</div>
                    <div className="flex items-center gap-2"><Icon name="Check" size={14} className="text-emerald-600" />Аналитика</div>
                    <div className="flex items-center gap-2"><Icon name="Check" size={14} className="text-emerald-600" />Продвижение</div>
                  </div>
                  <a
                    href="https://seller.wildberries.ru/supplier-settings/access-to-api"
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-primary hover:underline inline-flex items-center gap-1"
                  >
                    Где взять токен <Icon name="ExternalLink" size={12} />
                  </a>
                  <Button onClick={handleConnect} disabled={connecting || syncing} className="w-full gap-2">
                    {connecting || syncing ? (
                      <><Icon name="Loader2" size={16} className="animate-spin" />{syncing ? 'Загружаем данные...' : 'Подключаем...'}</>
                    ) : (
                      <><Icon name="Link2" size={16} />Подключить и загрузить данные</>
                    )}
                  </Button>
                </div>
                </DialogContent>
              </Dialog>
            )}

            {auth.isAuthenticated && (
              <Button size="lg" variant="outline" onClick={handleDemoSync} disabled={syncing} className="gap-2">
                {syncing ? <Icon name="Loader2" size={18} className="animate-spin" /> : <Icon name="Play" size={18} />}
                Попробовать на демо-данных
              </Button>
            )}
          </div>
        </div>

        <div className="mt-16 grid md:grid-cols-3 gap-4 max-w-5xl mx-auto">
          {[
            { n: 1, icon: 'KeyRound', title: 'Подключи токен', text: 'Вставьте API-ключ из кабинета продавца Wildberries.' },
            { n: 2, icon: 'Download', title: 'Мы подтянем данные', text: 'Загрузим заказы, продажи, остатки, рекламу за 90 дней.' },
            { n: 3, icon: 'Sparkles', title: 'Получите аналитику', text: 'Графики, прогнозы, инсайты и точки роста — сразу на дашборде.' },
          ].map((s) => (
            <div key={s.n} className="rounded-2xl border bg-card p-5">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center mb-3">
                <Icon name={s.icon} size={20} className="text-primary" />
              </div>
              <div className="text-xs text-muted-foreground font-medium mb-1">Шаг {s.n}</div>
              <div className="font-semibold">{s.title}</div>
              <div className="text-sm text-muted-foreground mt-1">{s.text}</div>
            </div>
          ))}
        </div>

        <div className="mt-10 grid md:grid-cols-2 lg:grid-cols-4 gap-3 max-w-5xl mx-auto">
          {[
            { icon: 'LineChart', title: 'Продажи и выручка', text: 'Динамика по дням, неделям, месяцам. Сравнение периодов.' },
            { icon: 'Package', title: 'Аналитика товаров', text: 'Топ, проблемные, точки роста. Маржа, ДРР, оборачиваемость.' },
            { icon: 'Megaphone', title: 'Эффективность рекламы', text: 'ДРР, CPO, ROI, CTR по кампаниям.' },
            { icon: 'TrendingUp', title: 'Прогноз на 90 дней', text: '3 сценария: базовый, оптимистичный, осторожный.' },
          ].map((f) => (
            <div key={f.title} className="rounded-xl border bg-card p-4">
              <Icon name={f.icon} size={18} className="text-primary" />
              <div className="mt-3 font-medium text-sm">{f.title}</div>
              <div className="text-xs text-muted-foreground mt-1">{f.text}</div>
            </div>
          ))}
        </div>

      </section>
    </div>
  );
}
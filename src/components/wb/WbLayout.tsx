import { ReactNode, useEffect, useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import WbSidebar from './WbSidebar';
import { useAuth } from '@/contexts/AuthContext';
import { wbApi, WbStatus } from '@/lib/wbApi';
import Icon from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

interface WbContextValue {
  status: WbStatus | null;
  reloadStatus: () => Promise<void>;
  userName: string | null;
}

export function WbLayout({ children }: { children?: ReactNode }) {
  const auth = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [status, setStatus] = useState<WbStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);

  const reloadStatus = async () => {
    if (!auth.isAuthenticated) {
      setStatus(null);
      setLoading(false);
      return;
    }
    try {
      const s = await wbApi.status();
      setStatus(s);
    } catch {
      setStatus(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (auth.isLoading) return;
    reloadStatus();
  }, [auth.isAuthenticated, auth.accessToken, auth.isLoading]);

  // Если не авторизован или не подключён — редирект на /wb (онбординг)
  useEffect(() => {
    if (loading || auth.isLoading) return;
    const isEntry = location.pathname === '/wb' || location.pathname === '/wb/';
    if (!auth.isAuthenticated && !isEntry) {
      navigate('/wb', { replace: true });
      return;
    }
    if (auth.isAuthenticated && !status?.connected && !isEntry && location.pathname !== '/wb/settings') {
      navigate('/wb', { replace: true });
    }
  }, [loading, auth.isAuthenticated, auth.isLoading, status, location.pathname]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex items-center gap-3 text-muted-foreground">
          <Icon name="Loader2" size={20} className="animate-spin" />
          Загружаем раздел...
        </div>
      </div>
    );
  }

  // Entry page без сайдбара
  if (location.pathname === '/wb' || location.pathname === '/wb/') {
    return <div className="min-h-screen bg-background">{children || <Outlet context={{ status, reloadStatus, userName: auth.user?.name } as WbContextValue} />}</div>;
  }

  return (
    <div className="min-h-screen bg-background flex">
      <div className="hidden md:block">
        <WbSidebar />
      </div>

      <div className="flex-1 min-w-0 flex flex-col">
        <header className="h-14 border-b bg-card/40 backdrop-blur sticky top-0 z-20 flex items-center gap-3 px-3 md:px-6">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden h-9 w-9">
                <Icon name="Menu" size={20} />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-64">
              <WbSidebar onNavigate={() => setMobileOpen(false)} />
            </SheetContent>
          </Sheet>

          <div className="flex items-center gap-2 min-w-0 flex-1">
            <Icon name="BarChart3" size={18} className="text-primary md:hidden shrink-0" />
            <div className="font-semibold truncate">{pageTitle(location.pathname)}</div>
          </div>

          {status?.connected && (
            <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground">
              <div className="h-2 w-2 rounded-full bg-emerald-500" />
              Кабинет ···{status.tokenLast4}
            </div>
          )}
          {auth.user && (
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium">
              {auth.user.name?.[0] || auth.user.email?.[0] || '?'}
            </div>
          )}
        </header>

        <main className="flex-1 overflow-x-hidden">
          {children || <Outlet context={{ status, reloadStatus, userName: auth.user?.name } as WbContextValue} />}
        </main>
      </div>
    </div>
  );
}

function pageTitle(path: string): string {
  if (path.startsWith('/wb/dashboard')) return 'Обзор';
  if (path.startsWith('/wb/sales')) return 'Продажи';
  if (path.startsWith('/wb/products')) return 'Товары';
  if (path.startsWith('/wb/ads')) return 'Реклама';
  if (path.startsWith('/wb/forecast')) return 'Прогноз';
  if (path.startsWith('/wb/insights')) return 'Инсайты';
  if (path.startsWith('/wb/settings')) return 'Настройки';
  return 'WB Аналитика';
}
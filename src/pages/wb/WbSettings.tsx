import { useEffect, useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { wbApi, WbStatus } from '@/lib/wbApi';
import Icon from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';

interface Ctx { status: WbStatus | null; reloadStatus: () => Promise<void> }

export default function WbSettings() {
  const ctx = useOutletContext<Ctx>();
  const navigate = useNavigate();
  const [syncing, setSyncing] = useState(false);
  const [open, setOpen] = useState(false);
  const [token, setToken] = useState('');
  const [connecting, setConnecting] = useState(false);

  useEffect(() => { ctx.reloadStatus(); }, []);

  const handleSync = async () => {
    setSyncing(true);
    try {
      const r = await wbApi.sync();
      toast.success(r.demoUsed ? 'Загружены демо-данные' : `Синхронизация завершена (${r.rows} строк)`);
      await ctx.reloadStatus();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Ошибка');
    } finally {
      setSyncing(false);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm('Отключить кабинет и удалить все данные?')) return;
    try {
      await wbApi.disconnect();
      toast.success('Кабинет отключён');
      await ctx.reloadStatus();
      navigate('/wb');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Ошибка');
    }
  };

  const handleReconnect = async () => {
    if (token.trim().length < 20) {
      toast.error('Токен слишком короткий');
      return;
    }
    setConnecting(true);
    try {
      await wbApi.connect(token.trim());
      toast.success('Токен обновлён');
      setOpen(false);
      setToken('');
      await ctx.reloadStatus();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Ошибка');
    } finally {
      setConnecting(false);
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-2xl space-y-5">
      <h1 className="text-xl md:text-2xl font-semibold">Настройки</h1>

      <div className="rounded-2xl border bg-card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="font-medium">Кабинет Wildberries</div>
            <div className="text-xs text-muted-foreground mt-0.5">
              {ctx.status?.connected ? `Подключён (токен ···${ctx.status.tokenLast4})` : 'Не подключён'}
            </div>
          </div>
          {ctx.status?.connected && (
            <div className="flex items-center gap-1.5 text-xs text-emerald-600">
              <div className="h-2 w-2 rounded-full bg-emerald-500" />
              Активен
            </div>
          )}
        </div>
        {ctx.status?.lastSyncAt && (
          <div className="text-xs text-muted-foreground">
            Последняя синхронизация: {new Date(ctx.status.lastSyncAt).toLocaleString('ru-RU')}
          </div>
        )}
        <div className="flex flex-wrap gap-2">
          <Button onClick={handleSync} disabled={syncing} className="gap-2">
            {syncing ? <Icon name="Loader2" size={16} className="animate-spin" /> : <Icon name="RefreshCw" size={16} />}
            Синхронизировать
          </Button>

          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Icon name="Key" size={16} />
                Обновить токен
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Обновить API-токен</DialogTitle>
                <DialogDescription>Старый токен будет заменён. Данные останутся.</DialogDescription>
              </DialogHeader>
              <Input value={token} onChange={(e) => setToken(e.target.value)} placeholder="eyJhbGciOi..." type="password" className="font-mono text-xs" />
              <DialogFooter>
                <Button onClick={handleReconnect} disabled={connecting} className="gap-2">
                  {connecting && <Icon name="Loader2" size={14} className="animate-spin" />}
                  Сохранить
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {ctx.status?.connected && (
            <Button variant="destructive" onClick={handleDisconnect} className="gap-2">
              <Icon name="Unplug" size={16} />
              Отключить кабинет
            </Button>
          )}
        </div>
      </div>

      <div className="rounded-2xl border bg-card p-5">
        <div className="font-medium">О данных</div>
        <div className="text-sm text-muted-foreground mt-2 space-y-1.5">
          <div>· Данные обновляются по кнопке «Синхронизировать»</div>
          <div>· Глубина загрузки — 90 дней</div>
          <div>· Токен хранится в зашифрованном виде и не передаётся в браузер</div>
          <div>· Если WB API недоступен — включается демо-режим для проверки интерфейса</div>
        </div>
      </div>
    </div>
  );
}

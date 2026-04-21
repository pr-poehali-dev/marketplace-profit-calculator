import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { wbApi } from '@/lib/wbApi';
import Icon from '@/components/ui/icon';
import { Button } from '@/components/ui/button';

type Data = Awaited<ReturnType<typeof wbApi.insights>>;

const TAG = {
  Рост: { icon: 'TrendingUp', color: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30' },
  Падение: { icon: 'TrendingDown', color: 'bg-red-500/10 text-red-600 border-red-500/30' },
  Риск: { icon: 'AlertTriangle', color: 'bg-amber-500/10 text-amber-600 border-amber-500/30' },
  Возможность: { icon: 'Sparkles', color: 'bg-primary/10 text-primary border-primary/30' },
} as Record<string, { icon: string; color: string }>;

export default function WbInsights() {
  const nav = useNavigate();
  const [data, setData] = useState<Data | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const r = await wbApi.insights();
      setData(r);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  return (
    <div className="p-4 md:p-6 space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-semibold">Инсайты</h1>
          <div className="text-sm text-muted-foreground">Автоматический поиск точек роста, проблем и рисков в вашем кабинете</div>
        </div>
        <Button onClick={load} variant="outline" size="sm" className="gap-2">
          <Icon name="RefreshCw" size={14} />
          Пересчитать
        </Button>
      </div>

      {loading && <div className="flex items-center gap-2 text-muted-foreground"><Icon name="Loader2" size={16} className="animate-spin" />Анализируем...</div>}

      {!loading && data && data.insights.length === 0 && (
        <div className="rounded-2xl border bg-card p-8 text-center">
          <Icon name="Sparkles" size={36} className="mx-auto text-muted-foreground" />
          <div className="mt-3 font-medium">Всё ровно</div>
          <div className="text-sm text-muted-foreground mt-1">На текущий момент аномалий и явных точек роста не найдено.</div>
        </div>
      )}

      {!loading && data && (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.insights.map((ins, i) => {
            const t = TAG[ins.tag] || { icon: 'Info', color: 'bg-muted text-muted-foreground border-border' };
            return (
              <div key={i} className={`rounded-2xl border-2 bg-card p-5 ${t.color}`}>
                <div className="flex items-center gap-2 text-xs font-medium">
                  <Icon name={t.icon} size={14} />
                  {ins.tag}
                </div>
                <div className="mt-3 font-semibold text-foreground">{ins.title}</div>
                {ins.description && <div className="mt-2 text-sm text-muted-foreground">{ins.description}</div>}
                {ins.linkPath && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => nav(ins.linkPath!)}
                    className="mt-3 -ml-2 h-8 gap-1"
                  >
                    Открыть
                    <Icon name="ChevronRight" size={14} />
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

import { useEffect, useMemo, useState } from 'react';
import { wbApi } from '@/lib/wbApi';
import { fmtMoney, fmtInt, fmtDate } from '@/lib/wbFormat';
import ChartCard from '@/components/wb/ChartCard';
import Icon from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend,
  ComposedChart, Area, ReferenceLine,
} from 'recharts';

type Data = Awaited<ReturnType<typeof wbApi.forecast>>;

const HORIZONS = [7, 30, 90];

export default function WbForecast() {
  const [horizon, setHorizon] = useState(30);
  const [adMult, setAdMult] = useState(1);
  const [priceMult, setPriceMult] = useState(1);
  const [data, setData] = useState<Data | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    wbApi.forecast(horizon, { adMultiplier: adMult, priceMultiplier: priceMult })
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [horizon, adMult, priceMult]);

  const chartData = useMemo(() => {
    if (!data || data.empty) return [];
    const history = data.history.slice(-30).map((h) => ({
      date: h.date,
      actualRev: h.revenue,
      actualProfit: h.profit,
      actualOrders: h.orders,
    }));
    const forecast = data.forecast.map((f) => ({
      date: f.date,
      baseRev: f.revenueBase,
      optRev: f.revenueOpt,
      cautRev: f.revenueCaut,
      baseProfit: f.profitBase,
      baseOrders: f.ordersBase,
      optOrders: f.ordersOpt,
      cautOrders: f.ordersCaut,
      range: [f.revenueCaut, f.revenueOpt],
    }));
    return [...history, ...forecast];
  }, [data]);

  const todayIso = useMemo(() => {
    if (!data?.history?.length) return null;
    return data.history[data.history.length - 1].date;
  }, [data]);

  if (loading || !data) return <div className="p-6 text-muted-foreground flex items-center gap-2"><Icon name="Loader2" size={16} className="animate-spin" />Считаем прогноз...</div>;
  if (data.empty) return <div className="p-6 text-muted-foreground">Недостаточно данных для прогноза.</div>;

  const { scenarios, factors } = data;

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-semibold">Прогноз на {horizon} дней</h1>
          <div className="text-sm text-muted-foreground">Модель: аддитивный Holt-Winters · недельная сезонность</div>
        </div>
        <div className="inline-flex items-center gap-1 p-1 rounded-lg bg-muted">
          {HORIZONS.map((h) => (
            <Button key={h} size="sm" variant="ghost" onClick={() => setHorizon(h)} className={`h-7 px-3 text-xs ${horizon === h ? 'bg-background shadow-sm' : ''}`}>
              {h}д
            </Button>
          ))}
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <ScenarioCard
          title="Базовый"
          color="primary"
          icon="Target"
          revenue={scenarios.base.revenue}
          profit={scenarios.base.profit}
          orders={scenarios.base.orders}
          description={scenarios.base.description}
        />
        <ScenarioCard
          title="Оптимистичный"
          color="success"
          icon="TrendingUp"
          revenue={scenarios.optimistic.revenue}
          profit={scenarios.optimistic.profit}
          orders={scenarios.optimistic.orders}
          description={scenarios.optimistic.description}
        />
        <ScenarioCard
          title="Осторожный"
          color="warning"
          icon="ShieldAlert"
          revenue={scenarios.cautious.revenue}
          profit={scenarios.cautious.profit}
          orders={scenarios.cautious.orders}
          description={scenarios.cautious.description}
        />
      </div>

      <ChartCard
        title="Выручка: факт и прогноз"
        subtitle="Сплошная линия — факт, пунктир — прогноз. Заливка — диапазон сценариев."
        icon="LineChart"
      >
        <div className="h-80">
          <ResponsiveContainer>
            <ComposedChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="date" tickFormatter={fmtDate} stroke="hsl(var(--muted-foreground))" fontSize={11} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickFormatter={(v) => (v / 1000).toFixed(0) + 'к'} />
              <Tooltip
                formatter={(v: number | number[]) => Array.isArray(v) ? `${fmtMoney(v[0])} — ${fmtMoney(v[1])}` : fmtMoney(v)}
                labelFormatter={(l) => fmtDate(l as string)}
                contentStyle={{ borderRadius: 12, border: '1px solid hsl(var(--border))', background: 'hsl(var(--card))' }}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              {todayIso && <ReferenceLine x={todayIso} stroke="hsl(var(--muted-foreground))" strokeDasharray="4 4" label={{ value: 'Сегодня', position: 'top', fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} />}
              <Area dataKey="range" name="Диапазон" fill="hsl(199 89% 48%)" fillOpacity={0.12} stroke="none" />
              <Line dataKey="actualRev" name="Факт" stroke="hsl(199 89% 48%)" strokeWidth={2.5} dot={false} connectNulls />
              <Line dataKey="baseRev" name="Базовый" stroke="hsl(199 89% 48%)" strokeWidth={2} strokeDasharray="5 5" dot={false} connectNulls />
              <Line dataKey="optRev" name="Оптимистичный" stroke="hsl(142 72% 45%)" strokeWidth={1.5} strokeDasharray="3 3" dot={false} connectNulls />
              <Line dataKey="cautRev" name="Осторожный" stroke="hsl(32 95% 50%)" strokeWidth={1.5} strokeDasharray="3 3" dot={false} connectNulls />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </ChartCard>

      <div className="grid md:grid-cols-2 gap-6">
        <ChartCard title="Прогноз прибыли" icon="TrendingUp">
          <div className="h-64">
            <ResponsiveContainer>
              <LineChart data={data.forecast}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="date" tickFormatter={fmtDate} stroke="hsl(var(--muted-foreground))" fontSize={11} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickFormatter={(v) => (v / 1000).toFixed(0) + 'к'} />
                <Tooltip formatter={(v: number) => fmtMoney(v)} labelFormatter={(l) => fmtDate(l as string)} contentStyle={{ borderRadius: 12, border: '1px solid hsl(var(--border))', background: 'hsl(var(--card))' }} />
                <Line dataKey="profitBase" name="Базовый" stroke="hsl(199 89% 48%)" strokeWidth={2} dot={false} />
                <Line dataKey="profitOpt" name="Оптим." stroke="hsl(142 72% 45%)" strokeWidth={1.5} dot={false} strokeDasharray="3 3" />
                <Line dataKey="profitCaut" name="Осторож." stroke="hsl(32 95% 50%)" strokeWidth={1.5} dot={false} strokeDasharray="3 3" />
                <Legend wrapperStyle={{ fontSize: 12 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard title="Прогноз заказов" icon="ShoppingBag">
          <div className="h-64">
            <ResponsiveContainer>
              <LineChart data={data.forecast}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="date" tickFormatter={fmtDate} stroke="hsl(var(--muted-foreground))" fontSize={11} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
                <Tooltip labelFormatter={(l) => fmtDate(l as string)} contentStyle={{ borderRadius: 12, border: '1px solid hsl(var(--border))', background: 'hsl(var(--card))' }} />
                <Line dataKey="ordersBase" name="Базовый" stroke="hsl(262 83% 58%)" strokeWidth={2} dot={false} />
                <Line dataKey="ordersOpt" name="Оптим." stroke="hsl(142 72% 45%)" strokeWidth={1.5} dot={false} strokeDasharray="3 3" />
                <Line dataKey="ordersCaut" name="Осторож." stroke="hsl(32 95% 50%)" strokeWidth={1.5} dot={false} strokeDasharray="3 3" />
                <Legend wrapperStyle={{ fontSize: 12 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <ChartCard title="Что влияет на прогноз" icon="Settings2">
          <div className="space-y-3">
            {factors.map((f) => (
              <div key={f.name} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span>{f.name}</span>
                  <span className="tabular-nums text-muted-foreground">{f.weight}%</span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div className="h-full bg-primary rounded-full" style={{ width: `${f.weight}%` }} />
                </div>
              </div>
            ))}
          </div>
        </ChartCard>

        <ChartCard title="Моделирование «что если»" subtitle="Измените параметры — прогноз пересчитается." icon="Sliders">
          <div className="space-y-5">
            <div>
              <div className="flex items-center justify-between text-sm mb-2">
                <span>Рекламный бюджет</span>
                <span className="tabular-nums font-medium">{adMult > 1 ? '+' : ''}{Math.round((adMult - 1) * 100)}%</span>
              </div>
              <Slider value={[adMult]} min={0.5} max={2} step={0.05} onValueChange={(v) => setAdMult(v[0])} />
            </div>
            <div>
              <div className="flex items-center justify-between text-sm mb-2">
                <span>Цена</span>
                <span className="tabular-nums font-medium">{priceMult > 1 ? '+' : ''}{Math.round((priceMult - 1) * 100)}%</span>
              </div>
              <Slider value={[priceMult]} min={0.7} max={1.3} step={0.02} onValueChange={(v) => setPriceMult(v[0])} />
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => { setAdMult(1); setPriceMult(1); }} className="gap-1">
                <Icon name="RotateCcw" size={14} />
                Сбросить
              </Button>
            </div>
          </div>
        </ChartCard>
      </div>
    </div>
  );
}

function ScenarioCard({ title, color, icon, revenue, profit, orders, description }: {
  title: string; color: 'primary' | 'success' | 'warning'; icon: string;
  revenue: number; profit: number; orders: number; description: string;
}) {
  const c = color === 'success' ? 'from-emerald-500/10 to-transparent border-emerald-500/30'
    : color === 'warning' ? 'from-amber-500/10 to-transparent border-amber-500/30'
    : 'from-primary/10 to-transparent border-primary/30';
  const t = color === 'success' ? 'text-emerald-600' : color === 'warning' ? 'text-amber-600' : 'text-primary';
  return (
    <div className={`rounded-2xl border-2 bg-gradient-to-b ${c} p-5`}>
      <div className="flex items-center gap-2">
        <Icon name={icon} size={18} className={t} />
        <div className={`font-semibold ${t}`}>{title}</div>
      </div>
      <div className="mt-4 text-3xl font-bold tabular-nums">{fmtMoney(revenue, true)}</div>
      <div className="text-xs text-muted-foreground">Выручка за период</div>
      <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
        <div>
          <div className="text-xs text-muted-foreground">Прибыль</div>
          <div className="font-medium tabular-nums">{fmtMoney(profit, true)}</div>
        </div>
        <div>
          <div className="text-xs text-muted-foreground">Заказы</div>
          <div className="font-medium tabular-nums">{fmtInt(orders)}</div>
        </div>
      </div>
      <div className="mt-3 text-xs text-muted-foreground">{description}</div>
    </div>
  );
}

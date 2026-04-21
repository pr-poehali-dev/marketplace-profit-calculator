import { useEffect, useMemo, useState } from 'react';
import { wbApi } from '@/lib/wbApi';
import { fmtMoney, fmtInt, fmtDate } from '@/lib/wbFormat';
import ChartCard from '@/components/wb/ChartCard';
import KpiCard from '@/components/wb/KpiCard';
import PeriodPicker from '@/components/wb/PeriodPicker';
import Icon from '@/components/ui/icon';
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend, BarChart, Bar,
} from 'recharts';

type Data = Awaited<ReturnType<typeof wbApi.sales>>;

export default function WbSales() {
  const [days, setDays] = useState(30);
  const [data, setData] = useState<Data | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    wbApi.sales(days).then(setData).catch(() => setData(null)).finally(() => setLoading(false));
  }, [days]);

  // Week buckets
  const weekly = useMemo(() => {
    if (!data?.series) return [];
    const buckets: Record<string, { week: string; revenue: number; orders: number }> = {};
    data.series.forEach((s) => {
      const d = new Date(s.date);
      const week = new Date(d);
      week.setDate(d.getDate() - d.getDay());
      const key = week.toISOString().slice(0, 10);
      if (!buckets[key]) buckets[key] = { week: key, revenue: 0, orders: 0 };
      buckets[key].revenue += s.revenue;
      buckets[key].orders += s.orders;
    });
    return Object.values(buckets);
  }, [data]);

  // Heatmap matrix (weeks x weekdays)
  const heatmap = useMemo(() => {
    if (!data?.calendar) return null;
    const max = Math.max(1, ...data.calendar.map((c) => c.revenue));
    const byDate = new Map(data.calendar.map((c) => [c.date, c]));
    const dates: Date[] = [];
    for (const s of data.series) dates.push(new Date(s.date));
    if (!dates.length) return null;
    const cols: Array<Array<{ date: string; revenue: number } | null>> = [];
    let col: Array<{ date: string; revenue: number } | null> = new Array(7).fill(null);
    dates.forEach((d, i) => {
      const wd = (d.getDay() + 6) % 7; // пн=0
      const iso = d.toISOString().slice(0, 10);
      const v = byDate.get(iso);
      col[wd] = { date: iso, revenue: v?.revenue || 0 };
      if (wd === 6 || i === dates.length - 1) {
        cols.push(col);
        col = new Array(7).fill(null);
      }
    });
    return { cols, max };
  }, [data]);

  if (loading || !data) {
    return <div className="p-6 text-muted-foreground flex items-center gap-2"><Icon name="Loader2" size={16} className="animate-spin" />Загружаем...</div>;
  }
  if (data.empty) {
    return <div className="p-6 text-muted-foreground">Нет данных.</div>;
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-semibold">Продажи</h1>
          <div className="text-sm text-muted-foreground">{fmtDate(data.period.from)} — {fmtDate(data.period.to)}</div>
        </div>
        <PeriodPicker value={days} onChange={setDays} />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <KpiCard title="Выручка" value={fmtMoney(data.kpi.revenue.value, true)} delta={data.kpi.revenue.delta} icon="Wallet" accent="primary" />
        <KpiCard title="Заказы" value={fmtInt(data.kpi.orders.value)} delta={data.kpi.orders.delta} icon="ShoppingBag" accent="primary" />
        <KpiCard title="Средний чек" value={fmtMoney(data.kpi.avgCheck.value, true)} delta={data.kpi.avgCheck.delta} icon="Receipt" accent="success" />
        <KpiCard title="Маржа" value={`${data.kpi.margin.value.toFixed(1)}%`} delta={data.kpi.margin.delta} icon="Percent" accent="success" />
      </div>

      <ChartCard title="Выручка по дням" icon="LineChart">
        <div className="h-72">
          <ResponsiveContainer>
            <LineChart data={data.series}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="date" tickFormatter={fmtDate} stroke="hsl(var(--muted-foreground))" fontSize={11} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickFormatter={(v) => (v / 1000).toFixed(0) + 'к'} />
              <Tooltip formatter={(v: number) => fmtMoney(v)} labelFormatter={(l) => fmtDate(l as string)} contentStyle={{ borderRadius: 12, border: '1px solid hsl(var(--border))', background: 'hsl(var(--card))' }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line type="monotone" dataKey="revenue" name="Выручка" stroke="hsl(199 89% 48%)" strokeWidth={2.5} dot={false} />
              <Line type="monotone" dataKey="profit" name="Прибыль" stroke="hsl(142 72% 45%)" strokeWidth={2.5} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </ChartCard>

      {weekly.length > 0 && (
        <ChartCard title="Выручка по неделям" icon="CalendarDays">
          <div className="h-56">
            <ResponsiveContainer>
              <BarChart data={weekly}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="week" tickFormatter={fmtDate} stroke="hsl(var(--muted-foreground))" fontSize={11} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickFormatter={(v) => (v / 1000).toFixed(0) + 'к'} />
                <Tooltip formatter={(v: number) => fmtMoney(v)} labelFormatter={(l) => 'Неделя с ' + fmtDate(l as string)} contentStyle={{ borderRadius: 12, border: '1px solid hsl(var(--border))', background: 'hsl(var(--card))' }} />
                <Bar dataKey="revenue" fill="hsl(262 83% 58%)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      )}

      {heatmap && (
        <ChartCard title="Календарь продаж" subtitle="Тепловая карта по дням" icon="Calendar">
          <div className="overflow-x-auto">
            <div className="flex gap-1 min-w-max">
              <div className="flex flex-col gap-1 text-[10px] text-muted-foreground pr-1 pt-1">
                {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map((d) => <div key={d} className="h-4">{d}</div>)}
              </div>
              {heatmap.cols.map((col, i) => (
                <div key={i} className="flex flex-col gap-1">
                  {col.map((cell, j) => {
                    if (!cell) return <div key={j} className="h-4 w-4" />;
                    const intensity = cell.revenue / heatmap.max;
                    const opacity = 0.1 + intensity * 0.9;
                    return (
                      <div
                        key={j}
                        className="h-4 w-4 rounded-sm"
                        style={{ background: `hsl(199 89% 48% / ${opacity})` }}
                        title={`${fmtDate(cell.date)}: ${fmtMoney(cell.revenue)}`}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
          <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
            <span>Меньше</span>
            {[0.15, 0.35, 0.6, 0.85].map((o) => (
              <div key={o} className="h-3 w-3 rounded-sm" style={{ background: `hsl(199 89% 48% / ${o})` }} />
            ))}
            <span>Больше</span>
          </div>
        </ChartCard>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        <ChartCard title="По регионам" icon="MapPin">
          <div className="space-y-2">
            {data.regions.slice(0, 10).map((r) => {
              const max = data.regions[0]?.revenue || 1;
              const pct = (r.revenue / max) * 100;
              return (
                <div key={r.region} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span>{r.region}</span>
                    <span className="tabular-nums text-muted-foreground">{fmtMoney(r.revenue, true)}</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </ChartCard>

        <ChartCard title="По складам" icon="Warehouse">
          <div className="space-y-2">
            {data.warehouses.map((w) => {
              const max = data.warehouses[0]?.revenue || 1;
              const pct = (w.revenue / max) * 100;
              return (
                <div key={w.warehouse} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span>{w.warehouse}</span>
                    <span className="tabular-nums text-muted-foreground">{fmtInt(w.orders)} зак.</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div className="h-full bg-[hsl(262_83%_58%)] rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </ChartCard>
      </div>
    </div>
  );
}

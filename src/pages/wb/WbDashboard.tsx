import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { wbApi } from '@/lib/wbApi';
import { fmtMoney, fmtInt, fmtDate } from '@/lib/wbFormat';
import KpiCard from '@/components/wb/KpiCard';
import ChartCard from '@/components/wb/ChartCard';
import PeriodPicker from '@/components/wb/PeriodPicker';
import Icon from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend,
  AreaChart, Area, PieChart, Pie, Cell, BarChart, Bar,
} from 'recharts';

type Data = Awaited<ReturnType<typeof wbApi.dashboard>>;

const PIE_COLORS = ['hsl(199 89% 48%)', 'hsl(262 83% 58%)', 'hsl(32 95% 50%)', 'hsl(0 84% 60%)', 'hsl(142 72% 45%)'];

export default function WbDashboard() {
  const navigate = useNavigate();
  const [days, setDays] = useState(30);
  const [data, setData] = useState<Data | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    wbApi.dashboard(days).then(setData).catch(() => setData(null)).finally(() => setLoading(false));
  }, [days]);

  const sparklines = useMemo(() => {
    if (!data?.series) return { revenue: [], profit: [], orders: [], drr: [] };
    return {
      revenue: data.series.map((s) => ({ v: s.revenue })),
      profit: data.series.map((s) => ({ v: Math.max(0, s.profit) })),
      orders: data.series.map((s) => ({ v: s.orders })),
      drr: data.series.map((s) => ({ v: s.adSpent })),
    };
  }, [data]);

  if (loading || !data) {
    return (
      <div className="p-6 flex items-center gap-2 text-muted-foreground">
        <Icon name="Loader2" size={16} className="animate-spin" />Загружаем дашборд...
      </div>
    );
  }

  if (data.empty) {
    return (
      <div className="p-6">
        <div className="rounded-2xl border bg-card p-8 text-center">
          <Icon name="Inbox" size={36} className="mx-auto text-muted-foreground" />
          <div className="mt-3 font-medium">Данных пока нет</div>
          <div className="text-sm text-muted-foreground mt-1">Запустите синхронизацию в настройках.</div>
          <Button className="mt-4" onClick={() => navigate('/wb/settings')}>Перейти в настройки</Button>
        </div>
      </div>
    );
  }

  const kpi = data.kpi;

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-semibold">Обзор кабинета</h1>
          <div className="text-sm text-muted-foreground">
            {fmtDate(data.period.from)} — {fmtDate(data.period.to)} · сравнение с прошлым периодом
          </div>
        </div>
        <PeriodPicker value={days} onChange={setDays} />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 md:gap-4">
        <KpiCard title="Выручка" value={fmtMoney(kpi.revenue.value, true)} delta={kpi.revenue.delta} icon="Wallet" accent="primary" sparkline={sparklines.revenue} />
        <KpiCard title="Прибыль" value={fmtMoney(kpi.profit.value, true)} delta={kpi.profit.delta} icon="TrendingUp" accent="success" sparkline={sparklines.profit} />
        <KpiCard title="Маржинальность" value={`${kpi.margin.value.toFixed(1)}%`} delta={kpi.margin.delta} icon="Percent" accent="success" />
        <KpiCard title="Заказы" value={fmtInt(kpi.orders.value)} delta={kpi.orders.delta} icon="ShoppingBag" accent="primary" sparkline={sparklines.orders} />
        <KpiCard title="Средний чек" value={fmtMoney(kpi.avgCheck.value, true)} delta={kpi.avgCheck.delta} icon="Receipt" accent="primary" />
        <KpiCard title="ДРР" value={`${kpi.drr.value.toFixed(1)}%`} delta={-kpi.drr.delta} icon="Megaphone" accent={kpi.drr.value > 20 ? 'danger' : 'warning'} />
      </div>

      <div className="grid lg:grid-cols-3 gap-4 md:gap-6">
        <ChartCard title="Выручка и прибыль" subtitle="Динамика по дням" icon="LineChart" className="lg:col-span-2">
          <div className="h-72">
            <ResponsiveContainer>
              <AreaChart data={data.series} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(199 89% 48%)" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="hsl(199 89% 48%)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradPro" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(142 72% 45%)" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="hsl(142 72% 45%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="date" tickFormatter={fmtDate} stroke="hsl(var(--muted-foreground))" fontSize={11} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickFormatter={(v) => (v / 1000).toFixed(0) + 'к'} />
                <Tooltip
                  contentStyle={{ borderRadius: 12, border: '1px solid hsl(var(--border))', background: 'hsl(var(--card))' }}
                  formatter={(v: number) => fmtMoney(v)}
                  labelFormatter={(l) => fmtDate(l as string)}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Area type="monotone" dataKey="revenue" name="Выручка" stroke="hsl(199 89% 48%)" fill="url(#gradRev)" strokeWidth={2} />
                <Area type="monotone" dataKey="profit" name="Прибыль" stroke="hsl(142 72% 45%)" fill="url(#gradPro)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard title="Структура расходов" subtitle="За период" icon="PieChart">
          <div className="h-72 flex items-center">
            <ResponsiveContainer>
              <PieChart>
                <Pie data={data.expenses} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={2}>
                  {data.expenses.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: number) => fmtMoney(v)} contentStyle={{ borderRadius: 12, border: '1px solid hsl(var(--border))', background: 'hsl(var(--card))' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-1.5 mt-2">
            {data.expenses.map((e, i) => (
              <div key={e.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                  <span>{e.name}</span>
                </div>
                <span className="tabular-nums font-medium">{fmtMoney(e.value, true)}</span>
              </div>
            ))}
          </div>
        </ChartCard>
      </div>

      <ChartCard title="Топ-5 товаров по выручке" subtitle="Клик по строке — переход к товару" icon="Award">
        <div className="h-64">
          <ResponsiveContainer>
            <BarChart data={data.topProducts} layout="vertical" margin={{ left: 20, right: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
              <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={11} tickFormatter={(v) => (v / 1000).toFixed(0) + 'к'} />
              <YAxis type="category" dataKey="subject" width={110} stroke="hsl(var(--muted-foreground))" fontSize={11} />
              <Tooltip formatter={(v: number) => fmtMoney(v)} contentStyle={{ borderRadius: 12, border: '1px solid hsl(var(--border))', background: 'hsl(var(--card))' }} />
              <Bar dataKey="revenue" fill="hsl(199 89% 48%)" radius={[0, 8, 8, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-3 space-y-1">
          {data.topProducts.map((p) => (
            <button
              key={p.nmId}
              onClick={() => navigate(`/wb/products?nm=${p.nmId}`)}
              className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-accent text-left"
            >
              <div className="min-w-0">
                <div className="text-sm font-medium truncate">{p.subject}</div>
                <div className="text-xs text-muted-foreground">{p.article} · {p.brand}</div>
              </div>
              <div className="text-right shrink-0">
                <div className="text-sm tabular-nums font-medium">{fmtMoney(p.revenue, true)}</div>
                <div className="text-xs text-muted-foreground">маржа {p.margin.toFixed(0)}%</div>
              </div>
            </button>
          ))}
        </div>
      </ChartCard>

      <div className="grid md:grid-cols-2 gap-4 md:gap-6">
        <ChartCard title="Заказы по дням" icon="ShoppingBag">
          <div className="h-56">
            <ResponsiveContainer>
              <BarChart data={data.series}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="date" tickFormatter={fmtDate} stroke="hsl(var(--muted-foreground))" fontSize={11} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
                <Tooltip formatter={(v: number) => fmtInt(v)} labelFormatter={(l) => fmtDate(l as string)} contentStyle={{ borderRadius: 12, border: '1px solid hsl(var(--border))', background: 'hsl(var(--card))' }} />
                <Bar dataKey="orders" fill="hsl(262 83% 58%)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard title="Расходы на рекламу" icon="Megaphone">
          <div className="h-56">
            <ResponsiveContainer>
              <LineChart data={data.series}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="date" tickFormatter={fmtDate} stroke="hsl(var(--muted-foreground))" fontSize={11} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickFormatter={(v) => (v / 1000).toFixed(0) + 'к'} />
                <Tooltip formatter={(v: number) => fmtMoney(v)} labelFormatter={(l) => fmtDate(l as string)} contentStyle={{ borderRadius: 12, border: '1px solid hsl(var(--border))', background: 'hsl(var(--card))' }} />
                <Line type="monotone" dataKey="adSpent" stroke="hsl(32 95% 50%)" strokeWidth={2.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>
    </div>
  );
}

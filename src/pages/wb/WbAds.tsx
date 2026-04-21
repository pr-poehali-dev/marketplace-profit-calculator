import { useEffect, useState } from 'react';
import { wbApi } from '@/lib/wbApi';
import { fmtMoney, fmtInt, fmtDate } from '@/lib/wbFormat';
import ChartCard from '@/components/wb/ChartCard';
import PeriodPicker from '@/components/wb/PeriodPicker';
import Icon from '@/components/ui/icon';
import {
  ResponsiveContainer, ComposedChart, Line, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend,
  ScatterChart, Scatter, ZAxis,
} from 'recharts';

type Data = Awaited<ReturnType<typeof wbApi.ads>>;

export default function WbAds() {
  const [days, setDays] = useState(30);
  const [data, setData] = useState<Data | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    wbApi.ads(days).then(setData).catch(() => setData(null)).finally(() => setLoading(false));
  }, [days]);

  if (loading || !data) return <div className="p-6 text-muted-foreground flex items-center gap-2"><Icon name="Loader2" size={16} className="animate-spin" />Загружаем...</div>;
  if (data.empty) return <div className="p-6 text-muted-foreground">Нет данных по рекламе.</div>;

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-xl md:text-2xl font-semibold">Реклама</h1>
        <PeriodPicker value={days} onChange={setDays} />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        {[
          { title: 'Расход', value: fmtMoney(data.kpi.spent, true), icon: 'Wallet', color: 'bg-amber-500/10 text-amber-600' },
          { title: 'Заказы с рекламы', value: fmtInt(data.kpi.adOrders), icon: 'ShoppingBag', color: 'bg-primary/10 text-primary' },
          { title: 'ДРР', value: `${data.kpi.drr.toFixed(1)}%`, icon: 'Percent', color: data.kpi.drr > 20 ? 'bg-red-500/10 text-red-600' : 'bg-emerald-500/10 text-emerald-600' },
          { title: 'CPO', value: fmtMoney(data.kpi.cpo), icon: 'Target', color: 'bg-primary/10 text-primary' },
          { title: 'CTR', value: `${data.kpi.ctr.toFixed(2)}%`, icon: 'MousePointerClick', color: 'bg-primary/10 text-primary' },
          { title: 'ROI', value: `${data.kpi.roi.toFixed(0)}%`, icon: 'TrendingUp', color: data.kpi.roi > 100 ? 'bg-emerald-500/10 text-emerald-600' : 'bg-amber-500/10 text-amber-600' },
          { title: 'Выручка с рекламы', value: fmtMoney(data.kpi.adRevenue, true), icon: 'Wallet', color: 'bg-primary/10 text-primary' },
        ].map((k) => (
          <div key={k.title} className="rounded-2xl border bg-card p-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-xs text-muted-foreground">{k.title}</div>
                <div className="mt-1 text-xl font-semibold tabular-nums">{k.value}</div>
              </div>
              <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${k.color}`}>
                <Icon name={k.icon} size={16} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <ChartCard title="Расход и заказы с рекламы" icon="Megaphone">
        <div className="h-72">
          <ResponsiveContainer>
            <ComposedChart data={data.series}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="date" tickFormatter={fmtDate} stroke="hsl(var(--muted-foreground))" fontSize={11} />
              <YAxis yAxisId="l" stroke="hsl(var(--muted-foreground))" fontSize={11} tickFormatter={(v) => (v / 1000).toFixed(0) + 'к'} />
              <YAxis yAxisId="r" orientation="right" stroke="hsl(var(--muted-foreground))" fontSize={11} />
              <Tooltip labelFormatter={(l) => fmtDate(l as string)} contentStyle={{ borderRadius: 12, border: '1px solid hsl(var(--border))', background: 'hsl(var(--card))' }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar yAxisId="l" dataKey="spent" name="Расход ₽" fill="hsl(32 95% 50%)" radius={[4, 4, 0, 0]} />
              <Line yAxisId="r" dataKey="orders" name="Заказы" stroke="hsl(262 83% 58%)" strokeWidth={2.5} dot={false} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </ChartCard>

      <ChartCard title="Эффективность кампаний" subtitle="Расход (X) × ROI (Y). Чем выше и правее — тем хуже. Вверху слева — лучшие." icon="ScatterChart">
        <div className="h-72">
          <ResponsiveContainer>
            <ScatterChart margin={{ left: 10, right: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis type="number" dataKey="spent" name="Расход" tickFormatter={(v) => (v / 1000).toFixed(0) + 'к'} stroke="hsl(var(--muted-foreground))" fontSize={11} />
              <YAxis type="number" dataKey="roi" name="ROI" unit="%" stroke="hsl(var(--muted-foreground))" fontSize={11} />
              <ZAxis type="number" dataKey="revenue" range={[60, 400]} />
              <Tooltip
                cursor={{ strokeDasharray: '3 3' }}
                contentStyle={{ borderRadius: 12, border: '1px solid hsl(var(--border))', background: 'hsl(var(--card))' }}
                formatter={(v: number, name: string) => name === 'Расход' ? fmtMoney(v) : name === 'ROI' ? `${v}%` : fmtMoney(v)}
                labelFormatter={() => ''}
              />
              <Scatter name="Кампании" data={data.campaigns} fill="hsl(199 89% 48%)" />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </ChartCard>

      <ChartCard title="Кампании" icon="List">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs text-muted-foreground">
              <tr>
                <th className="text-left py-2 font-medium">Кампания</th>
                <th className="text-right py-2 font-medium">Расход</th>
                <th className="text-right py-2 font-medium">Заказы</th>
                <th className="text-right py-2 font-medium">Выручка</th>
                <th className="text-right py-2 font-medium">ДРР</th>
                <th className="text-right py-2 font-medium">ROI</th>
              </tr>
            </thead>
            <tbody>
              {data.campaigns.map((c) => {
                const bad = c.drr > 30;
                return (
                  <tr key={c.id} className="border-t">
                    <td className="py-2">
                      <div className="font-medium">{c.name}</div>
                      <div className="text-xs text-muted-foreground">{c.type === 'auto' ? 'Авто' : 'Поиск'}</div>
                    </td>
                    <td className="py-2 text-right tabular-nums">{fmtMoney(c.spent, true)}</td>
                    <td className="py-2 text-right tabular-nums">{fmtInt(c.orders)}</td>
                    <td className="py-2 text-right tabular-nums">{fmtMoney(c.revenue, true)}</td>
                    <td className={`py-2 text-right tabular-nums ${bad ? 'text-red-600 font-medium' : ''}`}>{c.drr.toFixed(1)}%</td>
                    <td className={`py-2 text-right tabular-nums ${c.roi > 100 ? 'text-emerald-600 font-medium' : ''}`}>{c.roi.toFixed(0)}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </ChartCard>
    </div>
  );
}

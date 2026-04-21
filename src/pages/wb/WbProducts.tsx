import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { wbApi, ProductRow } from '@/lib/wbApi';
import { fmtMoney, fmtInt, fmtDate } from '@/lib/wbFormat';
import ChartCard from '@/components/wb/ChartCard';
import PeriodPicker from '@/components/wb/PeriodPicker';
import Icon from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, AreaChart, Area,
} from 'recharts';

type Sort = 'revenue' | 'profit' | 'margin' | 'orders' | 'drr' | 'stock';

const STATUS = {
  star: { label: 'Звезда', color: 'bg-emerald-500/10 text-emerald-600', icon: 'Star' },
  ok: { label: 'Норма', color: 'bg-sky-500/10 text-sky-600', icon: 'Check' },
  warn: { label: 'Проблема', color: 'bg-amber-500/10 text-amber-600', icon: 'AlertTriangle' },
};

export default function WbProducts() {
  const [days, setDays] = useState(30);
  const [data, setData] = useState<ProductRow[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<Sort>('revenue');
  const [openNm, setOpenNm] = useState<number | null>(null);
  const [detail, setDetail] = useState<Awaited<ReturnType<typeof wbApi.product>> | null>(null);
  const [params] = useSearchParams();

  useEffect(() => {
    setLoading(true);
    wbApi.products(days).then((r) => setData(r.products || [])).catch(() => setData([])).finally(() => setLoading(false));
  }, [days]);

  useEffect(() => {
    const nm = params.get('nm');
    if (nm) setOpenNm(Number(nm));
  }, [params]);

  useEffect(() => {
    if (openNm === null) {
      setDetail(null);
      return;
    }
    wbApi.product(openNm, days).then(setDetail).catch(() => setDetail(null));
  }, [openNm, days]);

  const filtered = useMemo(() => {
    if (!data) return [];
    const q = search.toLowerCase();
    return data
      .filter((p) => !q || p.article?.toLowerCase().includes(q) || p.subject?.toLowerCase().includes(q) || String(p.nmId).includes(q))
      .sort((a, b) => (b[sort] as number) - (a[sort] as number));
  }, [data, search, sort]);

  if (loading) return <div className="p-6 text-muted-foreground flex items-center gap-2"><Icon name="Loader2" size={16} className="animate-spin" />Загружаем...</div>;

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-xl md:text-2xl font-semibold">Товары</h1>
        <PeriodPicker value={days} onChange={setDays} />
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Icon name="Search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Артикул, название, nmID" className="pl-9" />
        </div>
        <div className="flex gap-1 text-xs">
          {(['revenue', 'profit', 'margin', 'orders', 'drr', 'stock'] as Sort[]).map((s) => (
            <Button key={s} size="sm" variant={sort === s ? 'default' : 'outline'} onClick={() => setSort(s)} className="h-8">
              {s === 'revenue' ? 'Выручка' : s === 'profit' ? 'Прибыль' : s === 'margin' ? 'Маржа' : s === 'orders' ? 'Заказы' : s === 'drr' ? 'ДРР' : 'Остатки'}
            </Button>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-xs text-muted-foreground">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Товар</th>
                <th className="text-right px-4 py-3 font-medium">Выручка</th>
                <th className="text-right px-4 py-3 font-medium hidden md:table-cell">Прибыль</th>
                <th className="text-right px-4 py-3 font-medium">Маржа</th>
                <th className="text-right px-4 py-3 font-medium hidden md:table-cell">Заказы</th>
                <th className="text-right px-4 py-3 font-medium hidden lg:table-cell">ДРР</th>
                <th className="text-right px-4 py-3 font-medium hidden lg:table-cell">Остаток</th>
                <th className="text-right px-4 py-3 font-medium">Статус</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => {
                const s = STATUS[p.status];
                return (
                  <tr key={p.nmId} onClick={() => setOpenNm(p.nmId)} className="border-t cursor-pointer hover:bg-accent transition">
                    <td className="px-4 py-3">
                      <div className="font-medium truncate max-w-[220px]">{p.subject}</div>
                      <div className="text-xs text-muted-foreground">{p.article} · {p.brand}</div>
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums font-medium">{fmtMoney(p.revenue, true)}</td>
                    <td className="px-4 py-3 text-right tabular-nums hidden md:table-cell">{fmtMoney(p.profit, true)}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{p.margin.toFixed(1)}%</td>
                    <td className="px-4 py-3 text-right tabular-nums hidden md:table-cell">{fmtInt(p.orders)}</td>
                    <td className="px-4 py-3 text-right tabular-nums hidden lg:table-cell">{p.drr.toFixed(1)}%</td>
                    <td className="px-4 py-3 text-right tabular-nums hidden lg:table-cell">{fmtInt(p.stock)}</td>
                    <td className="px-4 py-3 text-right">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs ${s.color}`}>
                        <Icon name={s.icon} size={12} />
                        {s.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr><td colSpan={8} className="px-4 py-10 text-center text-muted-foreground">Ничего не найдено</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={openNm !== null} onOpenChange={(o) => !o && setOpenNm(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Карточка товара nm {openNm}</DialogTitle>
          </DialogHeader>
          {!detail ? (
            <div className="py-10 text-center text-muted-foreground"><Icon name="Loader2" size={16} className="animate-spin inline mr-2" />Загружаем...</div>
          ) : (
            <div className="space-y-5">
              <ChartCard title="Продажи за период" icon="LineChart">
                <div className="h-56">
                  <ResponsiveContainer>
                    <AreaChart data={detail.series}>
                      <defs>
                        <linearGradient id="prodGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="hsl(199 89% 48%)" stopOpacity={0.4} />
                          <stop offset="100%" stopColor="hsl(199 89% 48%)" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                      <XAxis dataKey="date" tickFormatter={fmtDate} fontSize={11} stroke="hsl(var(--muted-foreground))" />
                      <YAxis fontSize={11} stroke="hsl(var(--muted-foreground))" tickFormatter={(v) => (v / 1000).toFixed(0) + 'к'} />
                      <Tooltip formatter={(v: number) => fmtMoney(v)} labelFormatter={(l) => fmtDate(l as string)} contentStyle={{ borderRadius: 12, border: '1px solid hsl(var(--border))', background: 'hsl(var(--card))' }} />
                      <Area type="monotone" dataKey="revenue" stroke="hsl(199 89% 48%)" fill="url(#prodGrad)" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </ChartCard>
              <ChartCard title="Заказы по дням" icon="ShoppingBag">
                <div className="h-48">
                  <ResponsiveContainer>
                    <LineChart data={detail.series}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                      <XAxis dataKey="date" tickFormatter={fmtDate} fontSize={11} stroke="hsl(var(--muted-foreground))" />
                      <YAxis fontSize={11} stroke="hsl(var(--muted-foreground))" />
                      <Tooltip labelFormatter={(l) => fmtDate(l as string)} contentStyle={{ borderRadius: 12, border: '1px solid hsl(var(--border))', background: 'hsl(var(--card))' }} />
                      <Line type="monotone" dataKey="orders" stroke="hsl(262 83% 58%)" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </ChartCard>
              <ChartCard title="Остатки по складам" icon="Warehouse">
                <div className="space-y-2">
                  {detail.stocks.map((s) => (
                    <div key={s.warehouse} className="flex items-center justify-between text-sm">
                      <span>{s.warehouse}</span>
                      <span className="tabular-nums font-medium">{fmtInt(s.qty)} шт.</span>
                    </div>
                  ))}
                  {detail.stocks.length === 0 && <div className="text-sm text-muted-foreground">Нет данных об остатках.</div>}
                </div>
              </ChartCard>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

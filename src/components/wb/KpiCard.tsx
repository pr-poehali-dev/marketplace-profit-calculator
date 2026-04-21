import Icon from '@/components/ui/icon';
import { cn } from '@/lib/utils';
import { ResponsiveContainer, AreaChart, Area } from 'recharts';

interface Props {
  title: string;
  value: string;
  delta?: number;
  icon: string;
  accent?: 'primary' | 'success' | 'warning' | 'danger';
  sparkline?: Array<{ v: number }>;
}

const COLOR = {
  primary: { bg: 'bg-primary/10', text: 'text-primary', chart: 'hsl(var(--primary))' },
  success: { bg: 'bg-emerald-500/10', text: 'text-emerald-600', chart: 'hsl(142 72% 45%)' },
  warning: { bg: 'bg-amber-500/10', text: 'text-amber-600', chart: 'hsl(32 95% 50%)' },
  danger: { bg: 'bg-red-500/10', text: 'text-red-600', chart: 'hsl(0 84% 60%)' },
};

export default function KpiCard({ title, value, delta, icon, accent = 'primary', sparkline }: Props) {
  const c = COLOR[accent];
  const positive = (delta ?? 0) >= 0;
  return (
    <div className="rounded-2xl border bg-card p-4 md:p-5 flex flex-col gap-3 hover:shadow-md transition">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-xs md:text-sm text-muted-foreground">{title}</div>
          <div className="mt-1 text-xl md:text-2xl font-semibold tabular-nums truncate">{value}</div>
        </div>
        <div className={cn('h-9 w-9 rounded-lg flex items-center justify-center shrink-0', c.bg)}>
          <Icon name={icon} size={18} className={c.text} />
        </div>
      </div>
      <div className="flex items-end justify-between gap-3">
        {delta !== undefined && (
          <div className={cn(
            'inline-flex items-center gap-1 text-xs font-medium rounded-full px-2 py-0.5',
            positive ? 'bg-emerald-500/10 text-emerald-600' : 'bg-red-500/10 text-red-600'
          )}>
            <Icon name={positive ? 'TrendingUp' : 'TrendingDown'} size={12} />
            {positive ? '+' : ''}{delta.toFixed(1)}%
          </div>
        )}
        {sparkline && sparkline.length > 1 && (
          <div className="flex-1 h-8 max-w-[100px]">
            <ResponsiveContainer>
              <AreaChart data={sparkline}>
                <defs>
                  <linearGradient id={`spark-${accent}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={c.chart} stopOpacity={0.4} />
                    <stop offset="100%" stopColor={c.chart} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area type="monotone" dataKey="v" stroke={c.chart} strokeWidth={1.5} fill={`url(#spark-${accent})`} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}

export const WB_API_URL = 'https://functions.poehali.dev/a64253f4-7852-4f3b-9c5a-03b2369b9296';

type AuthHeaderFn = () => Record<string, string>;

let authHeaderFn: AuthHeaderFn = () => ({});

export function setWbAuthHeaderProvider(fn: AuthHeaderFn) {
  authHeaderFn = fn;
}

async function call<T>(action: string, opts: {
  method?: 'GET' | 'POST' | 'DELETE';
  params?: Record<string, string | number>;
  body?: unknown;
} = {}): Promise<T> {
  const method = opts.method || 'GET';
  const params = new URLSearchParams({
    action,
    ...Object.fromEntries(Object.entries(opts.params || {}).map(([k, v]) => [k, String(v)])),
  });
  const url = `${WB_API_URL}?${params.toString()}`;
  const res = await fetch(url, {
    method,
    headers: { ...authHeaderFn(), 'Content-Type': 'application/json' },
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Ошибка запроса' }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json();
}

export interface WbStatus {
  connected: boolean;
  status?: string;
  tokenLast4?: string;
  lastSyncAt?: string | null;
  syncProgress?: number;
}

export interface KpiValue { value: number; delta: number }
export interface DashboardKpi {
  revenue: KpiValue; profit: KpiValue; margin: KpiValue;
  orders: KpiValue; avgCheck: KpiValue; drr: KpiValue; adSpent: KpiValue;
}
export interface SeriesPoint { date: string; revenue: number; profit: number; orders: number; adSpent: number }
export interface ExpenseItem { name: string; value: number }
export interface TopProduct {
  nmId: number; article: string; subject: string; brand: string;
  revenue: number; profit: number; margin: number; orders: number;
}
export interface ProductRow extends TopProduct {
  drr: number; stock: number; turnover: number; status: 'star' | 'ok' | 'warn';
}

export const wbApi = {
  status: () => call<WbStatus>('status'),
  connect: (token: string) => call<{ success: boolean; tokenLast4: string; warning?: string }>(
    'connect', { method: 'POST', body: { token } }
  ),
  disconnect: () => call<{ success: boolean }>('disconnect', { method: 'DELETE' }),
  sync: () => call<{ success: boolean; demoUsed: boolean; rows: number }>('sync', { method: 'POST' }),
  dashboard: (days: number) => call<{
    empty?: boolean;
    period: { from: string; to: string; days: number };
    kpi: DashboardKpi;
    series: SeriesPoint[];
    expenses: ExpenseItem[];
    topProducts: TopProduct[];
  }>('dashboard', { params: { days } }),
  sales: (days: number) => call<{
    empty?: boolean;
    period: { from: string; to: string; days: number };
    series: SeriesPoint[];
    calendar: Array<{ date: string; orders: number; revenue: number }>;
    regions: Array<{ region: string; orders: number; revenue: number }>;
    warehouses: Array<{ warehouse: string; orders: number; revenue: number }>;
    kpi: DashboardKpi;
  }>('sales', { params: { days } }),
  products: (days: number) => call<{
    empty?: boolean;
    products: ProductRow[];
  }>('products', { params: { days } }),
  product: (nmId: number, days: number) => call<{
    nmId: number;
    series: Array<{ date: string; orders: number; revenue: number; forPay: number }>;
    stocks: Array<{ warehouse: string; qty: number }>;
  }>('product', { params: { nmId, days } }),
  ads: (days: number) => call<{
    empty?: boolean;
    kpi: { spent: number; adOrders: number; adRevenue: number; drr: number; cpo: number; ctr: number; roi: number };
    series: Array<{ date: string; spent: number; orders: number; revenue: number }>;
    campaigns: Array<{ id: number; name: string; type: string; spent: number; orders: number; revenue: number; drr: number; roi: number; views: number; clicks: number }>;
  }>('ads', { params: { days } }),
  forecast: (horizon: number, whatIf?: { adMultiplier?: number; priceMultiplier?: number }) => call<{
    empty?: boolean;
    horizon: number;
    history: Array<{ date: string; revenue: number; profit: number; orders: number }>;
    forecast: Array<{
      date: string;
      revenueBase: number; revenueOpt: number; revenueCaut: number;
      profitBase: number; profitOpt: number; profitCaut: number;
      ordersBase: number; ordersOpt: number; ordersCaut: number;
    }>;
    scenarios: Record<'base' | 'optimistic' | 'cautious', { revenue: number; profit: number; orders: number; description: string }>;
    factors: Array<{ name: string; weight: number }>;
    whatIf: { adMultiplier: number; priceMultiplier: number };
  }>('forecast', {
    method: 'POST',
    params: { horizon },
    body: whatIf || {},
  }),
  insights: () => call<{
    insights: Array<{
      tag: string; severity: 'success' | 'warning' | 'danger' | 'info';
      title: string; description?: string;
      linkPath?: string; metricValue?: number; metricDelta?: number;
    }>;
    count: number;
  }>('insights'),
};
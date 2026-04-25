// Красивые моковые данные для раздела WB Аналитика
// Используется вместо wbApi, когда бэкенд недоступен или нужна демка.

function seeded(seed: number) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

// Каждый раз создаём новый генератор с фиксированным seed — данные всегда одинаковые
function makeRand() { return seeded(42); }
let rand = makeRand();

const PRODUCTS = [
  { nmId: 184523001, article: 'FP-TSHIRT-BLK-M', subject: 'Футболка базовая', category: 'Одежда', brand: 'FinPlace Basic', price: 1290 },
  { nmId: 184523002, article: 'FP-HOOD-GRY-L', subject: 'Худи оверсайз', category: 'Одежда', brand: 'FinPlace Basic', price: 3490 },
  { nmId: 184523003, article: 'FP-SNEAK-WHT-42', subject: 'Кроссовки белые', category: 'Обувь', brand: 'Urban Step', price: 5990 },
  { nmId: 184523004, article: 'FP-BAG-TAN-01', subject: 'Рюкзак городской', category: 'Аксессуары', brand: 'Urban Step', price: 2490 },
  { nmId: 184523005, article: 'FP-JACKET-GRN-M', subject: 'Куртка демисезонная', category: 'Одежда', brand: 'FinPlace Pro', price: 7990 },
  { nmId: 184523006, article: 'FP-JEANS-BLU-32', subject: 'Джинсы мужские slim', category: 'Одежда', brand: 'Denim Co', price: 3290 },
  { nmId: 184523007, article: 'FP-CAP-BLK-OS', subject: 'Кепка бейсболка', category: 'Аксессуары', brand: 'Urban Step', price: 990 },
  { nmId: 184523008, article: 'FP-DRESS-RED-S', subject: 'Платье коктейльное', category: 'Одежда', brand: 'Lumina', price: 4590 },
  { nmId: 184523009, article: 'FP-WATCH-SIL-01', subject: 'Часы наручные', category: 'Аксессуары', brand: 'Chrono Line', price: 8990 },
  { nmId: 184523010, article: 'FP-SCARF-MLT-02', subject: 'Шарф шерстяной', category: 'Аксессуары', brand: 'Lumina', price: 1790 },
];

const REGIONS = ['Москва', 'Санкт-Петербург', 'Екатеринбург', 'Краснодар', 'Казань', 'Новосибирск', 'Ростов-на-Дону', 'Самара', 'Уфа', 'Воронеж'];
const WAREHOUSES = ['Коледино', 'Электросталь', 'Казань', 'Краснодар', 'Подольск', 'Тула'];

function buildSeries(days: number) {
  rand = makeRand(); // сброс seed — данные всегда одинаковые
  const today = new Date('2026-04-25'); // фиксированная дата — даты не меняются при обновлении
  const series: Array<{ date: string; revenue: number; profit: number; orders: number; adSpent: number }> = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const isWeekend = d.getDay() === 0 || d.getDay() === 6;
    const weekBoost = isWeekend ? 1.3 : 1.0;
    const trend = 1 + (days - i) / days * 0.35;
    const noise = 0.8 + rand() * 0.5;
    const base = 113000 * weekBoost * trend * noise; // ~3.7млн за 30 дней
    const revenue = Math.round(base);
    const profit = Math.round(revenue * (0.22 + rand() * 0.08));
    const orders = Math.round(revenue / (1800 + rand() * 600));
    const adSpent = Math.round(revenue * (0.08 + rand() * 0.05));
    series.push({ date: d.toISOString().slice(0, 10), revenue, profit, orders, adSpent });
  }
  return series;
}

function kpiFromSeries(series: ReturnType<typeof buildSeries>) {
  const sum = (f: (p: typeof series[number]) => number) => series.reduce((acc, p) => acc + f(p), 0);
  const revenue = sum(p => p.revenue);
  const profit = sum(p => p.profit);
  const orders = sum(p => p.orders);
  const adSpent = sum(p => p.adSpent);
  const margin = revenue ? (profit / revenue) * 100 : 0;
  const drr = revenue ? (adSpent / revenue) * 100 : 0;
  const avgCheck = orders ? revenue / orders : 0;
  return {
    revenue: { value: revenue, delta: 18.4 },
    profit: { value: profit, delta: 24.7 },
    margin: { value: margin, delta: 3.2 },
    orders: { value: orders, delta: 12.1 },
    avgCheck: { value: avgCheck, delta: 5.6 },
    drr: { value: drr, delta: -2.8 },
    adSpent: { value: adSpent, delta: 8.9 },
  };
}

function buildExpenses(revenue: number, adSpent: number) {
  return [
    { name: 'Комиссия WB', value: Math.round(revenue * 0.17) },
    { name: 'Логистика', value: Math.round(revenue * 0.08) },
    { name: 'Хранение', value: Math.round(revenue * 0.02) },
    { name: 'Реклама', value: adSpent },
    { name: 'Себестоимость', value: Math.round(revenue * 0.4) },
  ];
}

function buildTopProducts() {
  const r = makeRand();
  return PRODUCTS.slice(0, 5).map((p, i) => {
    const multiplier = (5 - i) * 0.8 + 1;
    const orders = Math.round((120 - i * 18) * multiplier);
    const revenue = Math.round(p.price * orders * 0.92);
    const margin = 18 + r() * 18;
    const profit = Math.round(revenue * margin / 100);
    return { nmId: p.nmId, article: p.article, subject: p.subject, brand: p.brand, revenue, profit, margin, orders };
  });
}

function buildProductsFull(days: number) {
  const r = makeRand();
  return PRODUCTS.map((p, i) => {
    const k = 1 - i * 0.08;
    const orders = Math.max(8, Math.round((150 - i * 14) * (days / 30) * k));
    const revenue = Math.round(p.price * orders * (0.88 + r() * 0.1));
    const margin = 8 + r() * 28;
    const profit = Math.round(revenue * margin / 100);
    const drr = 6 + r() * 20;
    const stock = Math.round(50 + r() * 250);
    const turnover = Math.round(stock / (orders / days) * 10) / 10;
    const status: 'star' | 'ok' | 'warn' = margin > 25 ? 'star' : margin < 14 ? 'warn' : 'ok';
    return { ...p, revenue, profit, margin, orders, drr, stock, turnover, status };
  }).sort((a, b) => b.revenue - a.revenue);
}

function buildCalendar(series: ReturnType<typeof buildSeries>) {
  return series.map(s => ({ date: s.date, orders: s.orders, revenue: s.revenue }));
}

function buildRegions(totalRevenue: number) {
  const weights = [0.32, 0.19, 0.09, 0.08, 0.07, 0.065, 0.06, 0.05, 0.035, 0.03];
  return REGIONS.map((region, i) => ({
    region,
    orders: Math.round(totalRevenue * weights[i] / 2200),
    revenue: Math.round(totalRevenue * weights[i]),
  }));
}

function buildWarehouses(totalOrders: number) {
  const weights = [0.36, 0.22, 0.14, 0.12, 0.09, 0.07];
  return WAREHOUSES.map((warehouse, i) => ({
    warehouse,
    orders: Math.round(totalOrders * weights[i]),
    revenue: Math.round(totalOrders * weights[i] * 2200),
  }));
}

function buildAds(days: number) {
  const rAds = makeRand();
  const series = buildSeries(days);
  const adSeries = series.map(s => ({
    date: s.date,
    spent: s.adSpent,
    orders: Math.round(s.orders * 0.35),
    revenue: Math.round(s.adSpent * (2.8 + rAds() * 1.5)),
  }));
  const spent = adSeries.reduce((a, b) => a + b.spent, 0);
  const adOrders = adSeries.reduce((a, b) => a + b.orders, 0);
  const adRevenue = adSeries.reduce((a, b) => a + b.revenue, 0);
  const drr = adRevenue ? (spent / adRevenue) * 100 : 0;
  const cpo = adOrders ? spent / adOrders : 0;
  const views = Math.round(spent / 5.5);
  const clicks = Math.round(views * 0.045);
  const ctr = views ? (clicks / views) * 100 : 0;
  const roi = spent ? ((adRevenue - spent) / spent) * 100 : 0;

  const rCamp = makeRand();
  const campaigns = [
    { id: 901, name: 'Авто — Футболка базовая', type: 'auto', nmId: 184523001 },
    { id: 902, name: 'Поиск — Худи оверсайз', type: 'search', nmId: 184523002 },
    { id: 903, name: 'Авто — Кроссовки белые', type: 'auto', nmId: 184523003 },
    { id: 904, name: 'Поиск — Рюкзак городской', type: 'search', nmId: 184523004 },
    { id: 905, name: 'Авто — Куртка демисезон', type: 'auto', nmId: 184523005 },
    { id: 906, name: 'Поиск — Джинсы slim', type: 'search', nmId: 184523006 },
    { id: 907, name: 'Авто — Платье коктейль', type: 'auto', nmId: 184523008 },
  ].map((c, i) => {
    const s = Math.round(spent * (0.27 - i * 0.033));
    const r = Math.round(s * (1.5 + rCamp() * 2.5));
    const o = Math.round(r / 2400);
    const v = Math.round(s / 5);
    const cl = Math.round(v * 0.05);
    return {
      id: c.id, name: c.name, type: c.type,
      spent: s, orders: o, revenue: r,
      drr: r ? (s / r) * 100 : 0,
      roi: s ? ((r - s) / s) * 100 : 0,
      views: v, clicks: cl,
    };
  });

  return {
    kpi: { spent, adOrders, adRevenue, drr, cpo, ctr, roi },
    series: adSeries,
    campaigns,
  };
}

function buildForecast(horizon: number, adMult = 1, priceMult = 1) {
  const rForecast = makeRand();
  const history = buildSeries(60).map(s => ({ date: s.date, revenue: s.revenue, profit: s.profit, orders: s.orders }));
  const lastRev = history[history.length - 1].revenue;
  const lastProfit = history[history.length - 1].profit;
  const lastOrders = history[history.length - 1].orders;

  const today = new Date('2026-04-25');
  const forecast = [];
  for (let i = 1; i <= horizon; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    const growth = 1 + i * 0.006;
    const weekday = d.getDay();
    const seasonal = weekday === 0 || weekday === 6 ? 1.22 : 1.0;
    const noise = 0.93 + rForecast() * 0.14;

    const baseR = Math.round(lastRev * growth * seasonal * noise * priceMult);
    const baseP = Math.round(lastProfit * growth * seasonal * noise * priceMult - (adMult - 1) * lastRev * 0.05);
    const baseO = Math.round(lastOrders * growth * seasonal * noise);

    forecast.push({
      date: d.toISOString().slice(0, 10),
      revenueBase: baseR, revenueOpt: Math.round(baseR * 1.18), revenueCaut: Math.round(baseR * 0.85),
      profitBase: baseP, profitOpt: Math.round(baseP * 1.22), profitCaut: Math.round(baseP * 0.82),
      ordersBase: baseO, ordersOpt: Math.round(baseO * 1.18), ordersCaut: Math.round(baseO * 0.85),
    });
  }

  const sum = (f: (p: typeof forecast[number]) => number) => forecast.reduce((a, b) => a + f(b), 0);
  return {
    horizon,
    history,
    forecast,
    scenarios: {
      base: {
        revenue: sum(p => p.revenueBase), profit: sum(p => p.profitBase), orders: sum(p => p.ordersBase),
        description: 'Продолжение текущего тренда и сезонности без изменений.',
      },
      optimistic: {
        revenue: sum(p => p.revenueOpt), profit: sum(p => p.profitOpt), orders: sum(p => p.ordersOpt),
        description: 'Рост спроса, успешные акции, увеличение конверсии на 15–20%.',
      },
      cautious: {
        revenue: sum(p => p.revenueCaut), profit: sum(p => p.profitCaut), orders: sum(p => p.ordersCaut),
        description: 'Сезонный спад, снижение активности, консервативная оценка.',
      },
    },
    factors: [
      { name: 'Сезонность', weight: 35 },
      { name: 'Тренд', weight: 28 },
      { name: 'Остатки', weight: 18 },
      { name: 'Рекламный бюджет', weight: 12 },
      { name: 'Цена', weight: 7 },
    ],
    whatIf: { adMultiplier: adMult, priceMultiplier: priceMult },
  };
}

function buildInsights() {
  return [
    {
      tag: 'Рост', severity: 'success' as const,
      title: 'Худи оверсайз (FP-HOOD-GRY-L) вырос на +42.8%',
      description: 'Выручка за 14 дней выросла относительно предыдущих двух недель. Рекомендуем увеличить бюджет рекламы и пополнить остатки на складе Коледино.',
      linkPath: '/wb/products',
      metricDelta: 42.8,
    },
    {
      tag: 'Рост', severity: 'success' as const,
      title: 'Кроссовки белые (FP-SNEAK-WHT-42) — лидер категории «Обувь»',
      description: 'Доля товара в категории выросла до 38%. Маржа 31%, возврат ниже среднего. Хороший кандидат на расширение размерной сетки.',
      linkPath: '/wb/products',
      metricDelta: 28.5,
    },
    {
      tag: 'Падение', severity: 'danger' as const,
      title: 'Платье коктейльное (FP-DRESS-RED-S) теряет выручку: −24.3%',
      description: 'Падение выручки за 14 дней. Причина: рост цены на 8% на фоне акций у конкурентов. Проверьте ценовую стратегию и отзывы.',
      linkPath: '/wb/products',
      metricDelta: -24.3,
    },
    {
      tag: 'Риск', severity: 'danger' as const,
      title: 'Кампания «Поиск — Джинсы slim»: ДРР 38.4%',
      description: 'Рекламные расходы не окупаются. Рекомендуем снизить ставки на 25% или поставить на паузу, чтобы не съедать маржу.',
      linkPath: '/wb/ads',
      metricDelta: 38.4,
    },
    {
      tag: 'Риск', severity: 'warning' as const,
      title: 'Рюкзак городской закончится через 7 дней',
      description: 'Остаток 48 шт на всех складах, средний расход 6.8 шт/день. Запустите поставку на Коледино и Электросталь, чтобы не потерять позиции в выдаче.',
      linkPath: '/wb/products',
      metricValue: 7,
    },
    {
      tag: 'Риск', severity: 'warning' as const,
      title: 'Низкая оборачиваемость: Часы наручные (Chrono Line)',
      description: 'Остаток на складах 280 шт при продажах 2.1 шт/день. Оборачиваемость 133 дня — капитал заморожен, растут расходы на хранение.',
      linkPath: '/wb/products',
      metricValue: 133,
    },
    {
      tag: 'Возможность', severity: 'success' as const,
      title: 'Точка роста: Футболка базовая — ROI 312%',
      description: 'Рекламный бюджет всего 4 200 ₽ при выручке с рекламы 17 300 ₽. Увеличение бюджета в 2–3 раза даст пропорциональный рост выручки.',
      linkPath: '/wb/ads',
      metricValue: 312,
    },
    {
      tag: 'Возможность', severity: 'success' as const,
      title: 'Аудитория 25–34 даёт 54% заказов на Кроссовки',
      description: 'Рекомендуем настроить таргет-кампанию именно на эту аудиторию. Потенциал роста заказов +18% при сохранении ДРР.',
      linkPath: '/wb/ads',
      metricValue: 54,
    },
  ];
}

// Публичные API
const delay = <T>(value: T, ms = 300): Promise<T> => new Promise(r => setTimeout(() => r(value), ms));

export const wbMock = {
  status: () => delay({
    connected: true,
    status: 'connected',
    tokenLast4: 'a4c9',
    lastSyncAt: new Date().toISOString(),
    syncProgress: 100,
    createdAt: new Date(Date.now() - 86400_000 * 3).toISOString(),
  }),

  connect: (_token: string) => delay({ success: true, tokenLast4: 'a4c9' as string, warning: undefined as string | undefined }, 600),

  disconnect: () => delay({ success: true }, 300),

  sync: () => delay({ success: true, demoUsed: true, rows: 2847 }, 900),

  dashboard: (days: number) => {
    const series = buildSeries(days);
    const kpi = kpiFromSeries(series);
    return delay({
      period: {
        from: series[0].date,
        to: series[series.length - 1].date,
        days,
      },
      kpi,
      series,
      expenses: buildExpenses(kpi.revenue.value, kpi.adSpent.value),
      topProducts: buildTopProducts(),
    });
  },

  sales: (days: number) => {
    const series = buildSeries(days);
    const kpi = kpiFromSeries(series);
    return delay({
      period: { from: series[0].date, to: series[series.length - 1].date, days },
      series,
      calendar: buildCalendar(series),
      regions: buildRegions(kpi.revenue.value),
      warehouses: buildWarehouses(kpi.orders.value),
      kpi,
    });
  },

  products: (days: number) => delay({ products: buildProductsFull(days) }),

  product: (nmId: number, days: number) => {
    const rProd = makeRand();
    const series = buildSeries(days).map(s => ({
      date: s.date,
      orders: Math.max(1, Math.round(s.orders / 12 + rProd() * 5)),
      revenue: Math.round(s.revenue / 10 + rProd() * 5000),
      forPay: Math.round((s.revenue / 10 + rProd() * 5000) * 0.82),
    }));
    const rStocks = makeRand();
    return delay({
      nmId,
      series,
      stocks: [
        { warehouse: 'Коледино', qty: Math.round(50 + rStocks() * 100) },
        { warehouse: 'Электросталь', qty: Math.round(30 + rStocks() * 80) },
        { warehouse: 'Казань', qty: Math.round(20 + rStocks() * 60) },
        { warehouse: 'Краснодар', qty: Math.round(15 + rStocks() * 50) },
      ],
    });
  },

  ads: (days: number) => {
    const data = buildAds(days);
    const series = buildSeries(days);
    return delay({
      period: { from: series[0].date, to: series[series.length - 1].date, days },
      ...data,
    });
  },

  forecast: (horizon: number, whatIf?: { adMultiplier?: number; priceMultiplier?: number }) =>
    delay(buildForecast(horizon, whatIf?.adMultiplier ?? 1, whatIf?.priceMultiplier ?? 1), 400),

  insights: () => delay({ insights: buildInsights(), count: 8 }),
};
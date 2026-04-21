import { NavLink } from 'react-router-dom';
import Icon from '@/components/ui/icon';
import { cn } from '@/lib/utils';

const NAV = [
  { to: '/wb/dashboard', label: 'Обзор', icon: 'LayoutDashboard' },
  { to: '/wb/sales', label: 'Продажи', icon: 'ShoppingBag' },
  { to: '/wb/products', label: 'Товары', icon: 'Package' },
  { to: '/wb/ads', label: 'Реклама', icon: 'Megaphone' },
  { to: '/wb/forecast', label: 'Прогноз', icon: 'TrendingUp' },
  { to: '/wb/insights', label: 'Инсайты', icon: 'Sparkles' },
  { to: '/wb/settings', label: 'Настройки', icon: 'Settings' },
];

export default function WbSidebar({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <aside className="w-60 shrink-0 border-r bg-card/40 flex flex-col min-h-full">
      <div className="px-5 py-5 border-b">
        <NavLink to="/" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition">
          <Icon name="ChevronLeft" size={16} />
          <span>На главную</span>
        </NavLink>
        <div className="mt-3 flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Icon name="BarChart3" size={18} className="text-primary" />
          </div>
          <div>
            <div className="font-semibold text-sm leading-tight">FinPlace Pro</div>
            <div className="text-xs text-muted-foreground">WB Аналитика</div>
          </div>
        </div>
      </div>
      <nav className="p-3 flex-1 space-y-1">
        {NAV.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition',
                isActive ? 'bg-primary text-primary-foreground' : 'text-foreground/70 hover:bg-accent hover:text-accent-foreground'
              )
            }
          >
            <Icon name={item.icon} size={18} />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
      <div className="p-3 border-t text-xs text-muted-foreground">
        <div className="px-3 py-2">
          <div className="font-medium text-foreground">Премиум аналитика</div>
          <div className="mt-1">Данные, графики, прогноз, инсайты</div>
        </div>
      </div>
    </aside>
  );
}

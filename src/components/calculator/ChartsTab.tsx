import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { CalculationResult } from './types';

interface ChartsTabProps {
  calculations: CalculationResult[];
  onNavigateToCalculator: () => void;
}

const COLORS = ['#0EA5E9', '#8B5CF6', '#F97316', '#10B981', '#EF4444'];

const ChartsTab = ({ calculations, onNavigateToCalculator }: ChartsTabProps) => {
  if (calculations.length === 0) {
    return (
      <Card className="p-12 text-center">
        <Icon name="BarChart3" size={64} className="mx-auto mb-4 text-muted-foreground" />
        <h3 className="text-xl font-semibold mb-2">Нет данных для отображения</h3>
        <p className="text-muted-foreground mb-4">Выполните расчёт в калькуляторе</p>
        <Button onClick={onNavigateToCalculator}>
          Перейти к калькулятору
        </Button>
      </Card>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {calculations.map((calc, idx) => (
          <Card key={idx} className="p-6">
            <h3 className="font-semibold mb-4">{calc.productName}</h3>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">Выручка</p>
                <p className="text-xl font-bold">{calc.revenue.toLocaleString('ru-RU')} ₽</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Чистая прибыль</p>
                <p className="text-xl font-bold text-green-600">{calc.netProfit.toLocaleString('ru-RU')} ₽</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Маржинальность</p>
                <p className="text-xl font-bold">{calc.margin.toFixed(2)}%</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-6">Структура затрат</h3>
        <ResponsiveContainer width="100%" height={400}>
          <PieChart>
            <Pie
              data={[
                { name: 'Закупка', value: calculations[0].costBreakdown.purchase },
                { name: 'Комиссия МП', value: calculations[0].costBreakdown.commission },
                { name: 'Упаковка', value: calculations[0].costBreakdown.packaging },
                { name: 'Доставка', value: calculations[0].costBreakdown.delivery },
                { name: 'Прочее', value: calculations[0].costBreakdown.other },
              ]}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              outerRadius={140}
              fill="#8884d8"
              dataKey="value"
            >
              {COLORS.map((color, index) => (
                <Cell key={`cell-${index}`} fill={color} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </Card>

      {calculations.length > 1 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-6">Сравнение показателей товаров</h3>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={calculations}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="productName" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="revenue" fill="#0EA5E9" name="Выручка" />
              <Bar dataKey="netProfit" fill="#10B981" name="Чистая прибыль" />
              <Bar dataKey="totalCosts" fill="#EF4444" name="Затраты" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      )}
    </>
  );
};

export default ChartsTab;

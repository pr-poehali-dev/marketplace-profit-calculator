import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from 'recharts';
import { CalculationResult } from './types';

interface ChartsTabProps {
  calculations: CalculationResult[];
  onNavigateToCalculator: () => void;
}

const COLORS = ['#0EA5E9', '#8B5CF6', '#F97316', '#10B981', '#EF4444'];

const ChartsTab = ({ calculations, onNavigateToCalculator }: ChartsTabProps) => {
  const [selectedProducts, setSelectedProducts] = useState<number[]>([]);

  const toggleProductSelection = (index: number) => {
    setSelectedProducts((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  };

  const getBestProduct = () => {
    if (calculations.length === 0) return null;
    return calculations.reduce((best, current) =>
      current.margin > best.margin ? current : best
    );
  };

  const selectedCalcs = selectedProducts.length > 0
    ? calculations.filter((_, idx) => selectedProducts.includes(idx))
    : calculations;

  const bestProduct = getBestProduct();

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
      {calculations.length > 1 && bestProduct && (
        <Card className="p-6 bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <Icon name="TrendingUp" size={32} className="text-green-600" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-xl font-bold">Наиболее перспективный товар</h3>
                <Badge className="bg-green-600">Лучший выбор</Badge>
              </div>
              <p className="text-2xl font-bold text-green-700 mb-2">{bestProduct.productName}</p>
              <div className="grid grid-cols-3 gap-4 mt-4">
                <div>
                  <p className="text-sm text-muted-foreground">Маржинальность</p>
                  <p className="text-xl font-bold text-green-600">{bestProduct.margin.toFixed(2)}%</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Чистая прибыль</p>
                  <p className="text-xl font-bold text-green-600">{bestProduct.netProfit.toLocaleString('ru-RU')} ₽</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Выручка</p>
                  <p className="text-xl font-bold">{bestProduct.revenue.toLocaleString('ru-RU')} ₽</p>
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {calculations.map((calc, idx) => (
          <Card
            key={idx}
            className={`p-6 cursor-pointer transition-all hover:shadow-lg ${
              selectedProducts.includes(idx) ? 'ring-2 ring-primary' : ''
            } ${
              calc.productName === bestProduct?.productName ? 'border-green-400 border-2' : ''
            }`}
            onClick={() => toggleProductSelection(idx)}
          >
            <div className="flex items-start justify-between mb-4">
              <h3 className="font-semibold">{calc.productName}</h3>
              {calc.productName === bestProduct?.productName && (
                <Badge className="bg-green-600">
                  <Icon name="Star" size={12} className="mr-1" />
                  Лучший
                </Badge>
              )}
            </div>
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
            {selectedProducts.includes(idx) && (
              <div className="mt-4 pt-4 border-t">
                <Badge variant="outline" className="w-full justify-center">
                  <Icon name="Check" size={14} className="mr-1" />
                  Выбран для сравнения
                </Badge>
              </div>
            )}
          </Card>
        ))}
      </div>

      {selectedProducts.length > 1 && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold">Детальное сравнение выбранных товаров</h3>
            <Button variant="outline" size="sm" onClick={() => setSelectedProducts([])}>
              <Icon name="X" size={16} className="mr-2" />
              Сбросить выбор
            </Button>
          </div>
          <ResponsiveContainer width="100%" height={400}>
            <RadarChart data={[
              {
                metric: 'Маржа',
                ...Object.fromEntries(
                  selectedCalcs.map((calc, idx) => [calc.productName, calc.margin])
                ),
              },
              {
                metric: 'Прибыль',
                ...Object.fromEntries(
                  selectedCalcs.map((calc, idx) => [
                    calc.productName,
                    (calc.netProfit / 1000).toFixed(1),
                  ])
                ),
              },
              {
                metric: 'Выручка',
                ...Object.fromEntries(
                  selectedCalcs.map((calc, idx) => [
                    calc.productName,
                    (calc.revenue / 1000).toFixed(1),
                  ])
                ),
              },
            ]}>
              <PolarGrid />
              <PolarAngleAxis dataKey="metric" />
              <PolarRadiusAxis />
              {selectedCalcs.map((calc, idx) => (
                <Radar
                  key={idx}
                  name={calc.productName}
                  dataKey={calc.productName}
                  stroke={COLORS[idx % COLORS.length]}
                  fill={COLORS[idx % COLORS.length]}
                  fillOpacity={0.3}
                />
              ))}
              <Legend />
            </RadarChart>
          </ResponsiveContainer>
        </Card>
      )}

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
          <h3 className="text-lg font-semibold mb-6">Сравнение всех товаров</h3>
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
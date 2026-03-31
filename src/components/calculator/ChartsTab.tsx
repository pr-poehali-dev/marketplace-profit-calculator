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
      <Card className="p-8 md:p-12 text-center">
        <Icon name="BarChart3" size={48} className="mx-auto mb-4 text-muted-foreground md:hidden" />
        <Icon name="BarChart3" size={64} className="mx-auto mb-4 text-muted-foreground hidden md:block" />
        <h3 className="text-lg md:text-xl font-semibold mb-2">Нет данных для отображения</h3>
        <p className="text-sm md:text-base text-muted-foreground mb-4">Выполните расчёт в калькуляторе</p>
        <Button onClick={onNavigateToCalculator}>
          Перейти к калькулятору
        </Button>
      </Card>
    );
  }

  return (
    <>
      {calculations.length > 1 && bestProduct && (
        <Card className="p-4 md:p-6 bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
          <div className="flex items-start gap-3 md:gap-4">
            <div className="p-2 md:p-3 bg-green-100 rounded-lg shrink-0">
              <Icon name="TrendingUp" size={24} className="text-green-600 md:hidden" />
              <Icon name="TrendingUp" size={32} className="text-green-600 hidden md:block" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1 md:mb-2">
                <h3 className="text-base md:text-xl font-bold">Лучший товар</h3>
                <Badge className="bg-green-600 text-xs">Лучший выбор</Badge>
              </div>
              <p className="text-lg md:text-2xl font-bold text-green-700 mb-2 truncate">{bestProduct.productName}</p>
              <div className="grid grid-cols-3 gap-2 md:gap-4 mt-3 md:mt-4">
                <div>
                  <p className="text-xs md:text-sm text-muted-foreground">Маржа</p>
                  <p className="text-base md:text-xl font-bold text-green-600">{bestProduct.margin.toFixed(1)}%</p>
                </div>
                <div>
                  <p className="text-xs md:text-sm text-muted-foreground">Прибыль</p>
                  <p className="text-base md:text-xl font-bold text-green-600">{bestProduct.netProfit.toLocaleString('ru-RU')} ₽</p>
                </div>
                <div>
                  <p className="text-xs md:text-sm text-muted-foreground">Выручка</p>
                  <p className="text-base md:text-xl font-bold">{bestProduct.revenue.toLocaleString('ru-RU')} ₽</p>
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
        {calculations.map((calc, idx) => (
          <Card
            key={idx}
            className={`p-4 md:p-6 cursor-pointer transition-all hover:shadow-lg ${
              selectedProducts.includes(idx) ? 'ring-2 ring-primary' : ''
            } ${
              calc.productName === bestProduct?.productName ? 'border-green-400 border-2' : ''
            }`}
            onClick={() => toggleProductSelection(idx)}
          >
            <div className="flex items-start justify-between mb-3 md:mb-4">
              <h3 className="font-semibold text-sm md:text-base truncate mr-2">{calc.productName}</h3>
              {calc.productName === bestProduct?.productName && (
                <Badge className="bg-green-600 text-xs shrink-0">
                  <Icon name="Star" size={12} className="mr-1" />
                  Лучший
                </Badge>
              )}
            </div>
            <div className="space-y-2 md:space-y-3">
              <div className="flex justify-between items-baseline md:block">
                <p className="text-xs md:text-sm text-muted-foreground">Выручка</p>
                <p className="text-base md:text-xl font-bold">{calc.revenue.toLocaleString('ru-RU')} ₽</p>
              </div>
              <div className="flex justify-between items-baseline md:block">
                <p className="text-xs md:text-sm text-muted-foreground">Чистая прибыль</p>
                <p className="text-base md:text-xl font-bold text-green-600">{calc.netProfit.toLocaleString('ru-RU')} ₽</p>
              </div>
              <div className="flex justify-between items-baseline md:block">
                <p className="text-xs md:text-sm text-muted-foreground">Маржинальность</p>
                <p className="text-base md:text-xl font-bold">{calc.margin.toFixed(2)}%</p>
              </div>
            </div>
            {selectedProducts.includes(idx) && (
              <div className="mt-3 pt-3 md:mt-4 md:pt-4 border-t">
                <Badge variant="outline" className="w-full justify-center text-xs">
                  <Icon name="Check" size={14} className="mr-1" />
                  Выбран для сравнения
                </Badge>
              </div>
            )}
          </Card>
        ))}
      </div>

      {selectedProducts.length > 1 && (
        <Card className="p-4 md:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 md:mb-6">
            <h3 className="text-base md:text-lg font-semibold">Сравнение товаров</h3>
            <Button variant="outline" size="sm" onClick={() => setSelectedProducts([])}>
              <Icon name="X" size={16} className="mr-2" />
              Сбросить
            </Button>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart data={[
              {
                metric: 'Маржа',
                ...Object.fromEntries(
                  selectedCalcs.map((calc, idx) => [calc.productName, calc.margin])
                ),
              },
              {
                metric: 'ROI',
                ...Object.fromEntries(
                  selectedCalcs.map((calc, idx) => [calc.productName, calc.roi])
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

      <Card className="p-4 md:p-6">
        <h3 className="text-base md:text-lg font-semibold mb-4 md:mb-6">Структура затрат{calculations.length > 1 ? ' (сумма)' : ''}</h3>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={[
                { name: 'Закупка', value: Math.round(calculations.reduce((s, c) => s + c.costBreakdown.purchase, 0)) },
                { name: 'Комиссия МП', value: Math.round(calculations.reduce((s, c) => s + c.costBreakdown.commission, 0)) },
                { name: 'Упаковка', value: Math.round(calculations.reduce((s, c) => s + c.costBreakdown.packaging, 0)) },
                { name: 'Доставка', value: Math.round(calculations.reduce((s, c) => s + c.costBreakdown.delivery, 0)) },
                { name: 'Прочее', value: Math.round(calculations.reduce((s, c) => s + c.costBreakdown.other, 0)) },
              ].filter(d => d.value > 0)}
              cx="50%"
              cy="50%"
              labelLine={true}
              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              outerRadius={100}
              fill="#8884d8"
              dataKey="value"
            >
              {COLORS.map((color, index) => (
                <Cell key={`cell-${index}`} fill={color} />
              ))}
            </Pie>
            <Tooltip formatter={(value: number) => [`${value.toLocaleString('ru-RU')} ₽`, '']} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </Card>

      {calculations.length > 1 && (
        <>
          <Card className="p-4 md:p-6">
            <h3 className="text-base md:text-lg font-semibold mb-4 md:mb-6">Сравнение товаров</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={calculations}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="productName" tick={{ fontSize: 12 }} interval={0} angle={-20} textAnchor="end" height={50} />
                <YAxis tick={{ fontSize: 12 }} width={60} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="revenue" fill="#0EA5E9" name="Выручка" />
                <Bar dataKey="netProfit" fill="#10B981" name="Прибыль" />
                <Bar dataKey="totalCosts" fill="#EF4444" name="Затраты" />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          <Card className="p-4 md:p-6">
            <h3 className="text-base md:text-lg font-semibold mb-4 md:mb-6">ROI и Маржинальность</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={calculations}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="productName" tick={{ fontSize: 12 }} interval={0} angle={-20} textAnchor="end" height={50} />
                <YAxis tick={{ fontSize: 12 }} width={50} />
                <Tooltip formatter={(value) => `${Number(value).toFixed(2)}%`} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="roi" fill="#8B5CF6" name="ROI (%)" />
                <Bar dataKey="margin" fill="#10B981" name="Маржа (%)" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </>
      )}
    </>
  );
};

export default ChartsTab;
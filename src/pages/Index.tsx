import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Icon from '@/components/ui/icon';
import { toast } from 'sonner';
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

interface ProductData {
  id: string;
  name: string;
  quantity: number;
  purchasePrice: number;
  priceBeforeDiscount: number;
  discount: number;
  marketplaceCommission: number;
  packagingCost: number;
  contractorCost: number;
  photoContentCost: number;
  packagingPerUnit: number;
  deliveryCost: number;
  redemptionRate: number;
  storageCostPerDay: number;
  taxRate: number;
}

interface CalculationResult {
  productName: string;
  revenue: number;
  totalCosts: number;
  grossProfit: number;
  netProfit: number;
  margin: number;
  costBreakdown: {
    purchase: number;
    commission: number;
    packaging: number;
    delivery: number;
    other: number;
  };
}

const Index = () => {
  const [activeTab, setActiveTab] = useState('calculator');
  const [products, setProducts] = useState<ProductData[]>([]);
  const [currentProduct, setCurrentProduct] = useState<ProductData>({
    id: '',
    name: '',
    quantity: 0,
    purchasePrice: 0,
    priceBeforeDiscount: 0,
    discount: 0,
    marketplaceCommission: 0,
    packagingCost: 0,
    contractorCost: 0,
    photoContentCost: 0,
    packagingPerUnit: 0,
    deliveryCost: 0,
    redemptionRate: 0,
    taxRate: 0,
    storageCostPerDay: 0,
  });

  const [calculations, setCalculations] = useState<CalculationResult[]>([]);

  const calculateMetrics = (product: ProductData): CalculationResult => {
    const sellingPrice = product.priceBeforeDiscount * (1 - product.discount / 100);
    const revenue = sellingPrice * product.quantity * (product.redemptionRate / 100);
    
    const purchaseCost = product.purchasePrice * product.quantity;
    const commissionCost = revenue * (product.marketplaceCommission / 100);
    const totalPackaging = product.packagingCost + (product.packagingPerUnit * product.quantity);
    const otherCosts = product.contractorCost + product.photoContentCost + product.deliveryCost + (product.storageCostPerDay * 30 * product.quantity);
    
    const totalCosts = purchaseCost + commissionCost + totalPackaging + product.deliveryCost + otherCosts;
    const grossProfit = revenue - purchaseCost;
    const netProfitBeforeTax = revenue - totalCosts;
    const netProfit = netProfitBeforeTax * (1 - product.taxRate / 100);
    const margin = (netProfit / revenue) * 100;

    return {
      productName: product.name,
      revenue,
      totalCosts,
      grossProfit,
      netProfit,
      margin,
      costBreakdown: {
        purchase: purchaseCost,
        commission: commissionCost,
        packaging: totalPackaging,
        delivery: product.deliveryCost,
        other: otherCosts,
      },
    };
  };

  const handleCalculate = () => {
    if (!currentProduct.name) {
      toast.error('Введите название товара');
      return;
    }

    const newProduct = { ...currentProduct, id: Date.now().toString() };
    const result = calculateMetrics(newProduct);
    
    setProducts([...products, newProduct]);
    setCalculations([...calculations, result]);
    
    toast.success('Расчёт выполнен!');
    setActiveTab('charts');
  };

  const exportToExcel = () => {
    toast.info('Экспорт в Excel готовится...');
  };

  const COLORS = ['#0EA5E9', '#8B5CF6', '#F97316', '#10B981', '#EF4444'];

  const terms = [
    { term: 'Маржинальность', description: 'Процент чистой прибыли от выручки' },
    { term: 'Валовая прибыль', description: 'Выручка минус себестоимость товара' },
    { term: 'Чистая прибыль', description: 'Выручка минус все затраты и налоги' },
    { term: '% выкупа', description: 'Процент заказов, которые клиенты действительно выкупают' },
    { term: 'УСН', description: 'Упрощённая система налогообложения' },
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Icon name="TrendingUp" size={32} className="text-primary" />
              <div>
                <h1 className="text-2xl font-bold">Unit Экономика</h1>
                <p className="text-sm text-muted-foreground">Сервис для селлеров маркетплейсов</p>
              </div>
            </div>
            <Button onClick={exportToExcel} variant="outline">
              <Icon name="Download" size={18} className="mr-2" />
              Экспорт в Excel
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5 mb-8">
            <TabsTrigger value="calculator">
              <Icon name="Calculator" size={16} className="mr-2" />
              Финансовый анализ
            </TabsTrigger>
            <TabsTrigger value="charts">
              <Icon name="BarChart3" size={16} className="mr-2" />
              Диаграммы
            </TabsTrigger>
            <TabsTrigger value="history">
              <Icon name="History" size={16} className="mr-2" />
              История
            </TabsTrigger>
            <TabsTrigger value="terms">
              <Icon name="BookOpen" size={16} className="mr-2" />
              Справка
            </TabsTrigger>
            <TabsTrigger value="support">
              <Icon name="MessageCircle" size={16} className="mr-2" />
              Поддержка
            </TabsTrigger>
          </TabsList>

          <TabsContent value="calculator" className="space-y-6">
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-6">Калькулятор unit-экономики</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name">Название товара</Label>
                    <Input
                      id="name"
                      value={currentProduct.name}
                      onChange={(e) => setCurrentProduct({ ...currentProduct, name: e.target.value })}
                      placeholder="Например: Футболка базовая"
                    />
                  </div>

                  <div>
                    <Label htmlFor="quantity">Количество закупаемого товара</Label>
                    <Input
                      id="quantity"
                      type="number"
                      value={currentProduct.quantity || ''}
                      onChange={(e) => setCurrentProduct({ ...currentProduct, quantity: Number(e.target.value) })}
                      placeholder="100"
                    />
                  </div>

                  <div>
                    <Label htmlFor="purchasePrice">Цена закупки (₽)</Label>
                    <Input
                      id="purchasePrice"
                      type="number"
                      value={currentProduct.purchasePrice || ''}
                      onChange={(e) => setCurrentProduct({ ...currentProduct, purchasePrice: Number(e.target.value) })}
                      placeholder="500"
                    />
                  </div>

                  <div>
                    <Label htmlFor="priceBeforeDiscount">Цена до скидки (₽)</Label>
                    <Input
                      id="priceBeforeDiscount"
                      type="number"
                      value={currentProduct.priceBeforeDiscount || ''}
                      onChange={(e) => setCurrentProduct({ ...currentProduct, priceBeforeDiscount: Number(e.target.value) })}
                      placeholder="1500"
                    />
                  </div>

                  <div>
                    <Label htmlFor="discount">Скидка (%)</Label>
                    <Input
                      id="discount"
                      type="number"
                      value={currentProduct.discount || ''}
                      onChange={(e) => setCurrentProduct({ ...currentProduct, discount: Number(e.target.value) })}
                      placeholder="20"
                    />
                  </div>

                  <div>
                    <Label htmlFor="marketplaceCommission">Комиссия маркетплейса (%)</Label>
                    <Input
                      id="marketplaceCommission"
                      type="number"
                      value={currentProduct.marketplaceCommission || ''}
                      onChange={(e) => setCurrentProduct({ ...currentProduct, marketplaceCommission: Number(e.target.value) })}
                      placeholder="15"
                    />
                  </div>

                  <div>
                    <Label htmlFor="redemptionRate">% выкупа по категории</Label>
                    <Input
                      id="redemptionRate"
                      type="number"
                      value={currentProduct.redemptionRate || ''}
                      onChange={(e) => setCurrentProduct({ ...currentProduct, redemptionRate: Number(e.target.value) })}
                      placeholder="85"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="packagingCost">Затраты на упаковку (₽)</Label>
                    <Input
                      id="packagingCost"
                      type="number"
                      value={currentProduct.packagingCost || ''}
                      onChange={(e) => setCurrentProduct({ ...currentProduct, packagingCost: Number(e.target.value) })}
                      placeholder="50"
                    />
                  </div>

                  <div>
                    <Label htmlFor="contractorCost">Затраты на услуги подрядчиков (₽)</Label>
                    <Input
                      id="contractorCost"
                      type="number"
                      value={currentProduct.contractorCost || ''}
                      onChange={(e) => setCurrentProduct({ ...currentProduct, contractorCost: Number(e.target.value) })}
                      placeholder="1000"
                    />
                  </div>

                  <div>
                    <Label htmlFor="photoContentCost">Услуги фотоконтента (₽)</Label>
                    <Input
                      id="photoContentCost"
                      type="number"
                      value={currentProduct.photoContentCost || ''}
                      onChange={(e) => setCurrentProduct({ ...currentProduct, photoContentCost: Number(e.target.value) })}
                      placeholder="2000"
                    />
                  </div>

                  <div>
                    <Label htmlFor="packagingPerUnit">Упаковка на 1 единицу (₽)</Label>
                    <Input
                      id="packagingPerUnit"
                      type="number"
                      value={currentProduct.packagingPerUnit || ''}
                      onChange={(e) => setCurrentProduct({ ...currentProduct, packagingPerUnit: Number(e.target.value) })}
                      placeholder="30"
                    />
                  </div>

                  <div>
                    <Label htmlFor="deliveryCost">Затраты на доставку (₽)</Label>
                    <Input
                      id="deliveryCost"
                      type="number"
                      value={currentProduct.deliveryCost || ''}
                      onChange={(e) => setCurrentProduct({ ...currentProduct, deliveryCost: Number(e.target.value) })}
                      placeholder="500"
                    />
                  </div>

                  <div>
                    <Label htmlFor="storageCostPerDay">Хранение на складе за сутки (₽)</Label>
                    <Input
                      id="storageCostPerDay"
                      type="number"
                      value={currentProduct.storageCostPerDay || ''}
                      onChange={(e) => setCurrentProduct({ ...currentProduct, storageCostPerDay: Number(e.target.value) })}
                      placeholder="5"
                    />
                  </div>

                  <div>
                    <Label htmlFor="taxRate">Процент УСН (%)</Label>
                    <Input
                      id="taxRate"
                      type="number"
                      value={currentProduct.taxRate || ''}
                      onChange={(e) => setCurrentProduct({ ...currentProduct, taxRate: Number(e.target.value) })}
                      placeholder="6"
                    />
                  </div>
                </div>
              </div>

              <Button onClick={handleCalculate} className="w-full mt-6" size="lg">
                <Icon name="Calculator" size={20} className="mr-2" />
                Рассчитать показатели
              </Button>
            </Card>
          </TabsContent>

          <TabsContent value="charts" className="space-y-6">
            {calculations.length === 0 ? (
              <Card className="p-12 text-center">
                <Icon name="BarChart3" size={64} className="mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-xl font-semibold mb-2">Нет данных для отображения</h3>
                <p className="text-muted-foreground mb-4">Выполните расчёт в калькуляторе</p>
                <Button onClick={() => setActiveTab('calculator')}>
                  Перейти к калькулятору
                </Button>
              </Card>
            ) : (
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
            )}
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            {products.length === 0 ? (
              <Card className="p-12 text-center">
                <Icon name="History" size={64} className="mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-xl font-semibold mb-2">История пуста</h3>
                <p className="text-muted-foreground">Выполните первый расчёт</p>
              </Card>
            ) : (
              products.map((product, idx) => (
                <Card key={product.id} className="p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-semibold">{product.name}</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        Количество: {product.quantity} • Цена закупки: {product.purchasePrice} ₽
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Маржа</p>
                      <p className="text-xl font-bold">{calculations[idx]?.margin.toFixed(2)}%</p>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="terms" className="space-y-4">
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-6">Справка по терминам</h2>
              <div className="space-y-6">
                {terms.map((item, idx) => (
                  <div key={idx} className="border-b pb-4 last:border-0">
                    <h3 className="font-semibold text-lg mb-2">{item.term}</h3>
                    <p className="text-muted-foreground">{item.description}</p>
                  </div>
                ))}
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="support">
            <Card className="p-12 text-center">
              <Icon name="MessageCircle" size={64} className="mx-auto mb-4 text-primary" />
              <h2 className="text-2xl font-semibold mb-4">Поддержка</h2>
              <p className="text-lg text-muted-foreground mb-6">
                Александр Фролов
              </p>
              <Button size="lg" asChild>
                <a href="tel:+79037278007">
                  <Icon name="Phone" size={20} className="mr-2" />
                  +7 (903) 727-80-07
                </a>
              </Button>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Index;

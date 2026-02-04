import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Icon from '@/components/ui/icon';
import { toast } from 'sonner';
import { ProductData, CalculationResult } from '@/components/calculator/types';
import CalculatorForm from '@/components/calculator/CalculatorForm';
import ChartsTab from '@/components/calculator/ChartsTab';
import HistoryTab from '@/components/calculator/HistoryTab';
import { TermsTab, SupportTab } from '@/components/calculator/TermsAndSupport';

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
            <CalculatorForm
              currentProduct={currentProduct}
              setCurrentProduct={setCurrentProduct}
              onCalculate={handleCalculate}
            />
          </TabsContent>

          <TabsContent value="charts" className="space-y-6">
            <ChartsTab
              calculations={calculations}
              onNavigateToCalculator={() => setActiveTab('calculator')}
            />
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            <HistoryTab products={products} calculations={calculations} />
          </TabsContent>

          <TabsContent value="terms" className="space-y-4">
            <TermsTab />
          </TabsContent>

          <TabsContent value="support">
            <SupportTab />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Index;

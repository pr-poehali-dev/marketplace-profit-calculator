import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Icon from '@/components/ui/icon';
import { toast } from 'sonner';
import { ProductData, CalculationResult } from '@/components/calculator/types';
import CalculatorForm from '@/components/calculator/CalculatorForm';
import ChartsTab from '@/components/calculator/ChartsTab';
import HistoryTab from '@/components/calculator/HistoryTab';
import { TermsTab } from '@/components/calculator/TermsAndSupport';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { exportToExcel as exportToExcelUtil } from '@/utils/excelExport';

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
    if (calculations.length === 0) {
      toast.error('Нет данных для экспорта. Выполните хотя бы один расчёт.');
      return;
    }

    try {
      exportToExcelUtil(products, calculations);
      toast.success('Файл Excel успешно скачан!');
    } catch (error) {
      toast.error('Ошибка при экспорте в Excel');
      console.error(error);
    }
  };

  const handleDeleteProduct = (index: number) => {
    const newProducts = products.filter((_, idx) => idx !== index);
    const newCalculations = calculations.filter((_, idx) => idx !== index);
    
    setProducts(newProducts);
    setCalculations(newCalculations);
    
    toast.success('Товар удалён из истории');
  };



  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Icon name="TrendingUp" size={32} className="text-primary" />
              <div>
                <h1 className="text-2xl font-bold">FinPlace 2087</h1>
                <p className="text-sm text-muted-foreground">Сервис для селлеров маркетплейсов</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <Icon name="MessageCircle" size={18} className="mr-2" />
                    Поддержка
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Поддержка</DialogTitle>
                    <DialogDescription>
                      Свяжитесь с нами по любым вопросам
                    </DialogDescription>
                  </DialogHeader>
                  <div className="text-center py-6">
                    <Icon name="Phone" size={48} className="mx-auto mb-4 text-primary" />
                    <p className="text-lg font-semibold mb-2">Александр Фролов</p>
                    <Button size="lg" asChild className="mt-4">
                      <a href="tel:+79037278007">
                        <Icon name="Phone" size={20} className="mr-2" />
                        +7 (903) 727-80-07
                      </a>
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
              
              <Button onClick={exportToExcel} variant="outline" disabled={calculations.length === 0}>
                <Icon name="Download" size={18} className="mr-2" />
                Экспорт в Excel
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4 mb-8">
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
            <HistoryTab 
              products={products} 
              calculations={calculations}
              onDeleteProduct={handleDeleteProduct}
            />
          </TabsContent>

          <TabsContent value="terms" className="space-y-4">
            <TermsTab />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Index;
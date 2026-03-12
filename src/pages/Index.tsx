import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Icon from '@/components/ui/icon';
import { toast } from 'sonner';
import { ProductData, CalculationResult } from '@/components/calculator/types';
import CalculatorForm from '@/components/calculator/CalculatorForm';
import ChartsTab from '@/components/calculator/ChartsTab';
import HistoryTab from '@/components/calculator/HistoryTab';
import { TermsTab } from '@/components/calculator/TermsAndSupport';
import AIConsultant from '@/components/calculator/AIConsultant';
import { useYandexAuth } from '@/components/extensions/yandex-auth/useYandexAuth';
import { YandexLoginButton } from '@/components/extensions/yandex-auth/YandexLoginButton';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { exportToExcel as exportToExcelUtil } from '@/utils/excelExport';

const AUTH_URL = 'https://functions.poehali.dev/2e056aab-4184-456d-8c5a-84a93c8371be';
const REPORTS_URL = 'https://functions.poehali.dev/9662ad24-ec22-4880-95e2-3eadedb48c9b';

const STORAGE_KEY = 'finplace_data';

function loadFromStorage(): { products: ProductData[]; calculations: CalculationResult[] } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const data = JSON.parse(raw);
      return {
        products: data.products || [],
        calculations: data.calculations || [],
      };
    }
  } catch (e) {
    console.warn('Storage load error', e);
  }
  return { products: [], calculations: [] };
}

function saveToStorage(products: ProductData[], calculations: CalculationResult[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ products, calculations }));
}

const Index = () => {
  const stored = loadFromStorage();
  const [activeTab, setActiveTab] = useState('calculator');
  const [products, setProducts] = useState<ProductData[]>(stored.products);
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
    deliveryCost: 0,
    redemptionRate: 0,
    taxRate: 0,
    storageCostPerDay: 0,
  });

  const [calculations, setCalculations] = useState<CalculationResult[]>(stored.calculations);

  const auth = useYandexAuth({
    apiUrls: {
      authUrl: `${AUTH_URL}?action=auth-url`,
      callback: `${AUTH_URL}?action=callback`,
      refresh: `${AUTH_URL}?action=refresh`,
      logout: `${AUTH_URL}?action=logout`,
    },
  });

  useEffect(() => {
    saveToStorage(products, calculations);
  }, [products, calculations]);

  useEffect(() => {
    if (auth.isAuthenticated && auth.accessToken && products.length > 0) {
      saveReportsToCloud(products, calculations);
    }
  }, [auth.isAuthenticated]);

  const saveReportsToCloud = async (prods: ProductData[], calcs: CalculationResult[]) => {
    if (!auth.accessToken || prods.length === 0) return;
    try {
      await fetch(`${REPORTS_URL}?action=save`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...auth.getAuthHeader(),
        },
        body: JSON.stringify({ products: prods, calculations: calcs }),
      });
    } catch (e) {
      console.warn('Cloud save error', e);
    }
  };

  const loadReportsFromCloud = async () => {
    if (!auth.accessToken) return;
    try {
      const res = await fetch(`${REPORTS_URL}?action=list`, {
        headers: auth.getAuthHeader(),
      });
      const data = await res.json();
      if (data.reports && data.reports.length > 0) {
        const cloudProducts: ProductData[] = [];
        const cloudCalcs: CalculationResult[] = [];
        data.reports.forEach((r: { productData: ProductData; calculationResult: CalculationResult }) => {
          cloudProducts.push(r.productData);
          cloudCalcs.push(r.calculationResult);
        });
        const existingIds = new Set(products.map(p => p.id));
        const newProducts = cloudProducts.filter(p => !existingIds.has(p.id));
        const newCalcs = cloudCalcs.slice(0, newProducts.length);
        if (newProducts.length > 0) {
          setProducts(prev => [...prev, ...newProducts]);
          setCalculations(prev => [...prev, ...newCalcs]);
          toast.success(`Загружено ${newProducts.length} отчётов из облака`);
        }
      }
    } catch (e) {
      console.warn('Cloud load error', e);
    }
  };

  const calculateMetrics = (product: ProductData): CalculationResult => {
    const sellingPrice = product.priceBeforeDiscount * (1 - product.discount / 100);
    const revenue = sellingPrice * product.quantity * (product.redemptionRate / 100);

    const purchaseCost = product.purchasePrice * product.quantity;
    const commissionCost = revenue * (product.marketplaceCommission / 100);
    const packagingCost = product.packagingCost;
    const deliveryCost = product.deliveryCost;
    const storageCost = product.storageCostPerDay * 30 * product.quantity;
    const otherCosts = product.contractorCost + product.photoContentCost + storageCost;

    const totalCosts = purchaseCost + commissionCost + packagingCost + deliveryCost + otherCosts;
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
        packaging: packagingCost,
        delivery: deliveryCost,
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

    const updatedProducts = [...products, newProduct];
    const updatedCalcs = [...calculations, result];

    setProducts(updatedProducts);
    setCalculations(updatedCalcs);

    if (auth.isAuthenticated) {
      saveReportsToCloud([newProduct], [result]);
    }

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
                <h1 className="text-2xl font-bold text-left">FinPlace </h1>
                <p className="text-sm text-muted-foreground">Сервис для селлеров маркетплейсов</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={exportToExcel} variant="outline" disabled={calculations.length === 0}>
                <Icon name="Download" size={18} className="mr-2" />
                Экспорт
              </Button>

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

              {auth.isAuthenticated && auth.user ? (
                <Dialog>
                  <DialogTrigger asChild>
                    <button className="flex items-center gap-2 rounded-full border px-1.5 py-1.5 pr-3 hover:bg-accent transition-colors">
                      <Avatar className="h-8 w-8">
                        {auth.user.avatar_url && (
                          <AvatarImage src={auth.user.avatar_url} alt={auth.user.name || 'Аватар'} />
                        )}
                        <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                          {auth.user.name
                            ? auth.user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
                            : 'Я'}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-medium hidden sm:inline">
                        {auth.user.name?.split(' ')[0] || 'Аккаунт'}
                      </span>
                      <Icon name="Settings" size={16} className="text-muted-foreground" />
                    </button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>Настройки аккаунта</DialogTitle>
                      <DialogDescription>Информация о вашем аккаунте</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-6 py-4">
                      <div className="flex items-center gap-4">
                        <Avatar className="h-16 w-16">
                          {auth.user.avatar_url && (
                            <AvatarImage src={auth.user.avatar_url} alt={auth.user.name || 'Аватар'} />
                          )}
                          <AvatarFallback className="bg-primary text-primary-foreground text-lg">
                            {auth.user.name
                              ? auth.user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
                              : 'Я'}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-lg font-semibold">{auth.user.name || 'Пользователь'}</p>
                          <p className="text-sm text-muted-foreground">Вход через Яндекс</p>
                        </div>
                      </div>

                      <div className="space-y-3 rounded-lg border p-4">
                        {auth.user.email && (
                          <div className="flex items-center gap-3">
                            <Icon name="Mail" size={18} className="text-muted-foreground" />
                            <div>
                              <p className="text-xs text-muted-foreground">Email</p>
                              <p className="text-sm">{auth.user.email}</p>
                            </div>
                          </div>
                        )}
                        {auth.user.name && (
                          <div className="flex items-center gap-3">
                            <Icon name="User" size={18} className="text-muted-foreground" />
                            <div>
                              <p className="text-xs text-muted-foreground">Имя</p>
                              <p className="text-sm">{auth.user.name}</p>
                            </div>
                          </div>
                        )}
                        <div className="flex items-center gap-3">
                          <Icon name="BarChart3" size={18} className="text-muted-foreground" />
                          <div>
                            <p className="text-xs text-muted-foreground">Расчётов</p>
                            <p className="text-sm">{calculations.length}</p>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Button
                          variant="outline"
                          className="w-full justify-start"
                          onClick={loadReportsFromCloud}
                        >
                          <Icon name="CloudDownload" size={18} className="mr-2" />
                          Загрузить отчёты из облака
                        </Button>
                        <Button
                          variant="destructive"
                          className="w-full justify-start"
                          onClick={auth.logout}
                        >
                          <Icon name="LogOut" size={18} className="mr-2" />
                          Выйти из аккаунта
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              ) : (
                <YandexLoginButton onClick={auth.login} isLoading={auth.isLoading} />
              )}
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
      <AIConsultant currentProduct={currentProduct} />
    </div>
  );
};

export default Index;
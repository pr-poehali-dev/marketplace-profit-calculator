import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { ProductData, CalculationResult } from '@/components/calculator/types';
import { useAuth } from '@/contexts/AuthContext';
import { exportToExcel as exportToExcelUtil } from '@/utils/excelExport';

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

export function useIndexData() {
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
  const [cloudSynced, setCloudSynced] = useState(false);

  const authCtx = useAuth();
  const auth = {
    user: authCtx.user,
    isAuthenticated: authCtx.isAuthenticated,
    isLoading: authCtx.isLoading,
    accessToken: authCtx.accessToken,
    login: authCtx.loginYandex,
    logout: authCtx.logout,
    getAuthHeader: authCtx.getAuthHeader,
  };

  useEffect(() => {
    saveToStorage(products, calculations);
  }, [products, calculations]);

  useEffect(() => {
    if (auth.isAuthenticated && auth.accessToken && !cloudSynced) {
      setCloudSynced(true);
      syncWithCloud();
    }
  }, [auth.isAuthenticated, auth.accessToken, cloudSynced]);

  const syncWithCloud = async () => {
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

        setProducts(prev => {
          const existingIds = new Set(prev.map(p => p.id));
          const newFromCloud = cloudProducts.filter(p => !existingIds.has(p.id));
          if (newFromCloud.length > 0) {
            toast.success(`Загружено ${newFromCloud.length} расчётов из облака`);
          }
          const merged = [...prev, ...newFromCloud];
          return merged;
        });
        setCalculations(prev => {
          const existingNames = new Set(prev.map((c, i) => `${products[i]?.id}`));
          const startIdx = cloudProducts.length - cloudCalcs.length;
          const newCalcs = cloudCalcs.filter((_, i) => {
            const pid = cloudProducts[i]?.id;
            return !existingNames.has(pid);
          });
          return [...prev, ...newCalcs];
        });
      }

      if (products.length > 0) {
        await saveReportsToCloud(products, calculations);
      }
    } catch (e) {
      console.warn('Cloud sync error', e);
    }
  };

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
        if (newProducts.length > 0) {
          const newCalcs = cloudCalcs.filter((_, i) => !existingIds.has(cloudProducts[i]?.id));
          setProducts(prev => [...prev, ...newProducts]);
          setCalculations(prev => [...prev, ...newCalcs]);
          toast.success(`Загружено ${newProducts.length} расчётов из облака`);
        } else {
          toast.info('Все расчёты уже загружены');
        }
      } else {
        toast.info('В облаке нет сохранённых расчётов');
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

  return {
    activeTab,
    setActiveTab,
    products,
    currentProduct,
    setCurrentProduct,
    calculations,
    auth,
    handleCalculate,
    exportToExcel,
    handleDeleteProduct,
    loadReportsFromCloud,
  };
}

export type IndexData = ReturnType<typeof useIndexData>;

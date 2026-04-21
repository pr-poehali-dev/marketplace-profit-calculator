import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Icon from '@/components/ui/icon';
import CalculatorForm from '@/components/calculator/CalculatorForm';
import ChartsTab from '@/components/calculator/ChartsTab';
import HistoryTab from '@/components/calculator/HistoryTab';
import { TermsTab } from '@/components/calculator/TermsAndSupport';
import type { IndexData } from './useIndexData';

interface Props {
  activeTab: IndexData['activeTab'];
  setActiveTab: IndexData['setActiveTab'];
  products: IndexData['products'];
  currentProduct: IndexData['currentProduct'];
  setCurrentProduct: IndexData['setCurrentProduct'];
  calculations: IndexData['calculations'];
  handleCalculate: IndexData['handleCalculate'];
  handleDeleteProduct: IndexData['handleDeleteProduct'];
}

export default function IndexTabs({
  activeTab,
  setActiveTab,
  products,
  currentProduct,
  setCurrentProduct,
  calculations,
  handleCalculate,
  handleDeleteProduct,
}: Props) {
  return (
    <Tabs value={activeTab} onValueChange={setActiveTab}>
      <TabsList className="grid w-full grid-cols-4 mb-4 md:mb-8">
        <TabsTrigger value="calculator" className="text-xs md:text-sm px-1 md:px-3">
          <Icon name="Calculator" size={16} className="md:mr-2" />
          <span className="hidden md:inline">Финансовый анализ</span>
          <span className="md:hidden ml-1">Расчёт</span>
        </TabsTrigger>
        <TabsTrigger value="charts" className="text-xs md:text-sm px-1 md:px-3">
          <Icon name="BarChart3" size={16} className="md:mr-2" />
          <span className="hidden md:inline">Диаграммы</span>
          <span className="md:hidden ml-1">Графики</span>
        </TabsTrigger>
        <TabsTrigger value="history" className="text-xs md:text-sm px-1 md:px-3">
          <Icon name="History" size={16} className="md:mr-2" />
          <span className="hidden md:inline">История</span>
          <span className="md:hidden ml-1">Записи</span>
        </TabsTrigger>
        <TabsTrigger value="terms" className="text-xs md:text-sm px-1 md:px-3">
          <Icon name="BookOpen" size={16} className="md:mr-2" />
          <span className="hidden md:inline">Справка</span>
          <span className="md:hidden ml-1">Инфо</span>
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
  );
}

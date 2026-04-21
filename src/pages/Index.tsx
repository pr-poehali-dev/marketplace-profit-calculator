import AIConsultant from '@/components/calculator/AIConsultant';
import IndexHeader from './index/IndexHeader';
import IndexTabs from './index/IndexTabs';
import { useIndexData } from './index/useIndexData';

const Index = () => {
  const data = useIndexData();

  return (
    <div className="min-h-screen bg-background">
      <IndexHeader
        auth={data.auth}
        calculations={data.calculations}
        exportToExcel={data.exportToExcel}
      />

      <main className="container mx-auto px-3 py-4 md:px-4 md:py-8">
        <IndexTabs
          activeTab={data.activeTab}
          setActiveTab={data.setActiveTab}
          products={data.products}
          currentProduct={data.currentProduct}
          setCurrentProduct={data.setCurrentProduct}
          calculations={data.calculations}
          handleCalculate={data.handleCalculate}
          handleDeleteProduct={data.handleDeleteProduct}
        />
      </main>
      <AIConsultant currentProduct={data.currentProduct} />
    </div>
  );
};

export default Index;

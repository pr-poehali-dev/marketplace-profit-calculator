import { Card } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import { ProductData, CalculationResult } from './types';

interface HistoryTabProps {
  products: ProductData[];
  calculations: CalculationResult[];
}

const HistoryTab = ({ products, calculations }: HistoryTabProps) => {
  if (products.length === 0) {
    return (
      <Card className="p-12 text-center">
        <Icon name="History" size={64} className="mx-auto mb-4 text-muted-foreground" />
        <h3 className="text-xl font-semibold mb-2">История пуста</h3>
        <p className="text-muted-foreground">Выполните первый расчёт</p>
      </Card>
    );
  }

  return (
    <>
      {products.map((product, idx) => (
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
      ))}
    </>
  );
};

export default HistoryTab;

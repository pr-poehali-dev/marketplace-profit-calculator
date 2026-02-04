import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { ProductData, CalculationResult } from './types';

interface HistoryTabProps {
  products: ProductData[];
  calculations: CalculationResult[];
  onDeleteProduct: (index: number) => void;
}

const HistoryTab = ({ products, calculations, onDeleteProduct }: HistoryTabProps) => {
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
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h3 className="text-lg font-semibold">{product.name}</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Количество: {product.quantity} • Цена закупки: {product.purchasePrice} ₽
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Маржа</p>
              <p className="text-xl font-bold">{calculations[idx]?.margin.toFixed(2)}%</p>
            </div>
            <Button
              variant="destructive"
              size="icon"
              onClick={() => onDeleteProduct(idx)}
            >
              <Icon name="Trash2" size={18} />
            </Button>
          </div>
        </Card>
      ))}
    </>
  );
};

export default HistoryTab;
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
      <Card className="p-8 md:p-12 text-center">
        <Icon name="History" size={48} className="mx-auto mb-4 text-muted-foreground md:hidden" />
        <Icon name="History" size={64} className="mx-auto mb-4 text-muted-foreground hidden md:block" />
        <h3 className="text-lg md:text-xl font-semibold mb-2">История пуста</h3>
        <p className="text-sm md:text-base text-muted-foreground">Выполните первый расчёт</p>
      </Card>
    );
  }

  return (
    <>
      {products.map((product, idx) => (
        <Card key={product.id} className="p-4 md:p-6">
          <div className="flex items-start justify-between gap-2 md:gap-4">
            <div className="flex-1 min-w-0">
              <h3 className="text-base md:text-lg font-semibold truncate">{product.name}</h3>
              <p className="text-xs md:text-sm text-muted-foreground mt-1">
                {product.quantity} шт. • {product.purchasePrice} ₽
              </p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-xs md:text-sm text-muted-foreground">Маржа</p>
              <p className="text-base md:text-xl font-bold">{calculations[idx]?.margin.toFixed(2)}%</p>
            </div>
            <Button
              variant="destructive"
              size="icon"
              className="h-9 w-9 md:h-10 md:w-10 shrink-0"
              onClick={() => onDeleteProduct(idx)}
            >
              <Icon name="Trash2" size={16} />
            </Button>
          </div>
        </Card>
      ))}
    </>
  );
};

export default HistoryTab;
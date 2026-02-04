import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Icon from '@/components/ui/icon';
import { ProductData } from './types';

interface CalculatorFormProps {
  currentProduct: ProductData;
  setCurrentProduct: (product: ProductData) => void;
  onCalculate: () => void;
}

const CalculatorForm = ({ currentProduct, setCurrentProduct, onCalculate }: CalculatorFormProps) => {
  return (
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

      <Button onClick={onCalculate} className="w-full mt-6" size="lg">
        <Icon name="Calculator" size={20} className="mr-2" />
        Рассчитать показатели
      </Button>
    </Card>
  );
};

export default CalculatorForm;

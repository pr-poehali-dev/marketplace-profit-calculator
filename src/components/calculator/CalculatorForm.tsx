import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import Icon from '@/components/ui/icon';
import { ProductData } from './types';

type Preset = Omit<ProductData, 'id'>;

const PRESETS: { label: string; emoji: string; data: Preset }[] = [
  {
    label: 'Одежда',
    emoji: '👕',
    data: {
      name: 'Футболка базовая',
      quantity: 100,
      purchasePrice: 400,
      priceBeforeDiscount: 1800,
      discount: 25,
      marketplaceCommission: 20,
      redemptionRate: 40,
      packagingCost: 500,
      packagingPerUnit: 25,
      contractorCost: 3000,
      photoContentCost: 5000,
      deliveryCost: 2000,
      storageCostPerDay: 0.5,
      taxRate: 6,
    },
  },
  {
    label: 'Электроника',
    emoji: '📱',
    data: {
      name: 'Аксессуар для телефона',
      quantity: 200,
      purchasePrice: 300,
      priceBeforeDiscount: 1200,
      discount: 15,
      marketplaceCommission: 12,
      redemptionRate: 88,
      packagingCost: 800,
      packagingPerUnit: 20,
      contractorCost: 2000,
      photoContentCost: 3000,
      deliveryCost: 3000,
      storageCostPerDay: 0.3,
      taxRate: 6,
    },
  },
  {
    label: 'Косметика',
    emoji: '💄',
    data: {
      name: 'Крем для лица',
      quantity: 150,
      purchasePrice: 200,
      priceBeforeDiscount: 900,
      discount: 20,
      marketplaceCommission: 25,
      redemptionRate: 75,
      packagingCost: 600,
      packagingPerUnit: 15,
      contractorCost: 2500,
      photoContentCost: 4000,
      deliveryCost: 1500,
      storageCostPerDay: 0.2,
      taxRate: 6,
    },
  },
  {
    label: 'Товары для дома',
    emoji: '🏠',
    data: {
      name: 'Органайзер для кухни',
      quantity: 80,
      purchasePrice: 600,
      priceBeforeDiscount: 2200,
      discount: 18,
      marketplaceCommission: 15,
      redemptionRate: 82,
      packagingCost: 700,
      packagingPerUnit: 40,
      contractorCost: 2000,
      photoContentCost: 3500,
      deliveryCost: 2500,
      storageCostPerDay: 0.8,
      taxRate: 6,
    },
  },
  {
    label: 'Спорт',
    emoji: '🏋️',
    data: {
      name: 'Эспандер латексный',
      quantity: 120,
      purchasePrice: 150,
      priceBeforeDiscount: 700,
      discount: 20,
      marketplaceCommission: 12,
      redemptionRate: 85,
      packagingCost: 400,
      packagingPerUnit: 10,
      contractorCost: 1500,
      photoContentCost: 2500,
      deliveryCost: 1200,
      storageCostPerDay: 0.2,
      taxRate: 6,
    },
  },
];

interface CalculatorFormProps {
  currentProduct: ProductData;
  setCurrentProduct: (product: ProductData) => void;
  onCalculate: () => void;
}

const fields: {
  key: keyof ProductData;
  label: string;
  placeholder: string;
  hint: string;
  suffix?: string;
}[] = [
  {
    key: 'name',
    label: 'Название товара',
    placeholder: 'Например: Футболка базовая',
    hint: 'Произвольное название для идентификации товара в истории и отчётах.',
  },
  {
    key: 'quantity',
    label: 'Количество закупаемого товара',
    placeholder: '100',
    hint: 'Сколько единиц товара вы планируете закупить. Влияет на расчёт общих затрат и выручки.',
  },
  {
    key: 'purchasePrice',
    label: 'Цена закупки',
    placeholder: '500',
    suffix: '₽',
    hint: 'Стоимость одной единицы товара у поставщика (без учёта доставки и упаковки).',
  },
  {
    key: 'priceBeforeDiscount',
    label: 'Цена до скидки',
    placeholder: '1500',
    suffix: '₽',
    hint: 'Цена, по которой товар выставлен на маркетплейсе до применения скидки (зачёркнутая цена).',
  },
  {
    key: 'discount',
    label: 'Скидка',
    placeholder: '20',
    suffix: '%',
    hint: 'Процент скидки от цены до скидки. Итоговая цена продажи = цена до скидки × (1 − скидка / 100).',
  },
  {
    key: 'marketplaceCommission',
    label: 'Комиссия маркетплейса',
    placeholder: '15',
    suffix: '%',
    hint: 'Процент, который удерживает маркетплейс с каждой продажи. Для Wildberries обычно 5–25% в зависимости от категории.',
  },
  {
    key: 'redemptionRate',
    label: '% выкупа по категории',
    placeholder: '85',
    suffix: '%',
    hint: 'Доля заказов, которые покупатели реально оплачивают и не возвращают. Например, для одежды ~40%, для электроники ~90%.',
  },
  {
    key: 'packagingCost',
    label: 'Затраты на упаковку',
    placeholder: '50',
    suffix: '₽',
    hint: 'Общая фиксированная стоимость расходников: пакеты, коробки, стикеры, лента — на всю партию.',
  },
  {
    key: 'packagingPerUnit',
    label: 'Упаковка на 1 единицу',
    placeholder: '30',
    suffix: '₽',
    hint: 'Стоимость упаковки одной единицы товара. Умножается на количество и прибавляется к общим затратам.',
  },
  {
    key: 'contractorCost',
    label: 'Затраты на услуги подрядчиков',
    placeholder: '1000',
    suffix: '₽',
    hint: 'Расходы на сторонних исполнителей: фулфилмент, сортировка, маркировка, реклама — на всю партию.',
  },
  {
    key: 'photoContentCost',
    label: 'Услуги фотоконтента',
    placeholder: '2000',
    suffix: '₽',
    hint: 'Стоимость съёмки и обработки фотографий товара для карточки на маркетплейсе.',
  },
  {
    key: 'deliveryCost',
    label: 'Затраты на доставку',
    placeholder: '500',
    suffix: '₽',
    hint: 'Стоимость логистики от поставщика до склада маркетплейса (на всю партию).',
  },
  {
    key: 'storageCostPerDay',
    label: 'Хранение на складе в сутки',
    placeholder: '5',
    suffix: '₽',
    hint: 'Стоимость хранения одной единицы товара на складе маркетплейса за сутки. В расчёте берётся период 30 дней.',
  },
  {
    key: 'taxRate',
    label: 'Процент УСН',
    placeholder: '6',
    suffix: '%',
    hint: 'Ставка упрощённой системы налогообложения. Обычно 6% с доходов или 15% с доходов минус расходы.',
  },
];

const FieldLabel = ({ label, hint, suffix }: { label: string; hint: string; suffix?: string }) => (
  <div className="flex items-center gap-1.5 mb-1.5">
    <Label>{label}{suffix ? ` (${suffix})` : ''}</Label>
    <Tooltip>
      <TooltipTrigger asChild>
        <button type="button" className="text-muted-foreground hover:text-foreground transition-colors">
          <Icon name="CircleHelp" size={14} />
        </button>
      </TooltipTrigger>
      <TooltipContent side="right" className="max-w-xs text-sm">
        {hint}
      </TooltipContent>
    </Tooltip>
  </div>
);

const CalculatorForm = ({ currentProduct, setCurrentProduct, onCalculate }: CalculatorFormProps) => {
  const leftFields = fields.slice(0, 7);
  const rightFields = fields.slice(7);

  const applyPreset = (preset: Preset) => {
    setCurrentProduct({ ...currentProduct, ...preset });
  };

  const renderField = (field: typeof fields[number]) => (
    <div key={field.key}>
      <FieldLabel label={field.label} hint={field.hint} suffix={field.suffix} />
      <Input
        id={field.key}
        type={field.key === 'name' ? 'text' : 'number'}
        value={field.key === 'name' ? (currentProduct[field.key] as string) : (currentProduct[field.key] as number) || ''}
        onChange={(e) =>
          setCurrentProduct({
            ...currentProduct,
            [field.key]: field.key === 'name' ? e.target.value : Number(e.target.value),
          })
        }
        placeholder={field.placeholder}
      />
    </div>
  );

  return (
    <Card className="p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <h2 className="text-xl font-semibold">Калькулятор unit-экономики</h2>
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((preset) => (
            <Tooltip key={preset.label}>
              <TooltipTrigger asChild>
                <Badge
                  variant="outline"
                  className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors px-3 py-1 text-sm"
                  onClick={() => applyPreset(preset.data)}
                >
                  {preset.emoji} {preset.label}
                </Badge>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                Заполнить типовыми значениями для категории «{preset.label}»
              </TooltipContent>
            </Tooltip>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">{leftFields.map(renderField)}</div>
        <div className="space-y-4">{rightFields.map(renderField)}</div>
      </div>

      <Button onClick={onCalculate} className="w-full mt-6" size="lg">
        <Icon name="Calculator" size={20} className="mr-2" />
        Рассчитать показатели
      </Button>
    </Card>
  );
};

export default CalculatorForm;
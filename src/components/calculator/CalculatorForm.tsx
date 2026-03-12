import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import Icon from '@/components/ui/icon';
import { ProductData } from './types';

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
      <h2 className="text-xl font-semibold mb-6">Калькулятор unit-экономики</h2>

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

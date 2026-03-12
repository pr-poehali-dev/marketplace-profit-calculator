import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import Icon from '@/components/ui/icon';
import { ProductData } from './types';

interface CategoryPreset {
  label: string;
  emoji: string;
  marketplaceCommission: number;
  redemptionRate: number;
}

const PRESETS: CategoryPreset[] = [
  { label: 'Одежда', emoji: '👕', marketplaceCommission: 20, redemptionRate: 75 },
  { label: 'Электроника', emoji: '📱', marketplaceCommission: 12, redemptionRate: 88 },
  { label: 'Косметика', emoji: '💄', marketplaceCommission: 25, redemptionRate: 75 },
  { label: 'Товары для дома', emoji: '🏠', marketplaceCommission: 15, redemptionRate: 82 },
  { label: 'Спорт', emoji: '🏋️', marketplaceCommission: 12, redemptionRate: 85 },
  { label: 'Продукты питания', emoji: '🍎', marketplaceCommission: 10, redemptionRate: 92 },
  { label: 'Детские товары', emoji: '🧸', marketplaceCommission: 18, redemptionRate: 78 },
  { label: 'Книги', emoji: '📚', marketplaceCommission: 8, redemptionRate: 95 },
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
  const [popoverOpen, setPopoverOpen] = useState(false);
  const leftFields = fields.slice(0, 7);
  const rightFields = fields.slice(7);

  const applyPreset = (preset: CategoryPreset) => {
    setCurrentProduct({
      ...currentProduct,
      marketplaceCommission: preset.marketplaceCommission,
      redemptionRate: preset.redemptionRate,
    });
    setPopoverOpen(false);
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
        <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm">
              <Icon name="LayoutTemplate" size={16} className="mr-2" />
              Выбрать категорию
              <Icon name="ChevronDown" size={14} className="ml-1" />
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-64 p-2">
            <p className="text-xs text-muted-foreground px-2 pb-2">
              Заполнит комиссию и % выкупа
            </p>
            <div className="space-y-0.5">
              {PRESETS.map((preset) => (
                <button
                  key={preset.label}
                  onClick={() => applyPreset(preset)}
                  className="w-full flex items-center justify-between px-2 py-2 rounded-md hover:bg-muted transition-colors text-sm"
                >
                  <span>{preset.emoji} {preset.label}</span>
                  <span className="text-muted-foreground text-xs">
                    {preset.marketplaceCommission}% / {preset.redemptionRate}%
                  </span>
                </button>
              ))}
            </div>
          </PopoverContent>
        </Popover>
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
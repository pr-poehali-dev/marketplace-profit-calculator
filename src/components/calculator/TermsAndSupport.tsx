import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';

const terms = [
  { term: 'Маржинальность', description: 'Процент чистой прибыли от выручки' },
  { term: 'Валовая прибыль', description: 'Выручка минус себестоимость товара' },
  { term: 'Чистая прибыль', description: 'Выручка минус все затраты и налоги' },
  { term: '% выкупа', description: 'Процент заказов, которые клиенты действительно выкупают' },
  { term: 'УСН', description: 'Упрощённая система налогообложения' },
  { term: 'ROI (Return on Investment)', description: 'Возврат на инвестиции — показывает, сколько рублей прибыли принёс каждый вложенный рубль. Формула: (Выручка − Затраты) / Затраты × 100%. ROI 200% означает, что на каждый вложенный рубль вы получили 2 рубля прибыли.' },
  { term: 'ДРР (Доля рекламных расходов)', description: 'Процент от выручки, который вы тратите на рекламу. Формула: Расходы на рекламу / Выручка с рекламы × 100%. Чем ниже ДРР — тем эффективнее реклама. Норма на маркетплейсах: 8–15%.' },
  { term: 'CPO (Cost Per Order)', description: 'Стоимость одного заказа с рекламы. Формула: Расходы на рекламу / Количество заказов. Показывает, во сколько вам обходится каждый покупатель через рекламный канал.' },
  { term: 'CTR (Click-Through Rate)', description: 'Кликабельность рекламного объявления — процент людей, которые кликнули на объявление после его просмотра. Формула: Клики / Показы × 100%. Средний CTR на маркетплейсах: 2–6%.' },
];

export const TermsTab = () => {
  return (
    <Card className="p-4 md:p-6">
      <h2 className="text-lg md:text-xl font-semibold mb-4 md:mb-6">Справка по терминам</h2>
      <div className="space-y-4 md:space-y-6">
        {terms.map((item, idx) => (
          <div key={idx} className="border-b pb-3 md:pb-4 last:border-0">
            <h3 className="font-semibold text-base md:text-lg mb-1 md:mb-2">{item.term}</h3>
            <p className="text-sm md:text-base text-muted-foreground">{item.description}</p>
          </div>
        ))}
      </div>
    </Card>
  );
};

export const SupportTab = () => {
  return (
    <Card className="p-8 md:p-12 text-center">
      <Icon name="MessageCircle" size={48} className="mx-auto mb-4 text-primary md:hidden" />
      <Icon name="MessageCircle" size={64} className="mx-auto mb-4 text-primary hidden md:block" />
      <h2 className="text-xl md:text-2xl font-semibold mb-4">Поддержка</h2>
      <p className="text-base md:text-lg text-muted-foreground mb-6">
        Александр Фролов
      </p>
      <Button size="lg" asChild>
        <a href="tel:+79037278007">
          <Icon name="Phone" size={20} className="mr-2" />
          +7 (903) 727-80-07
        </a>
      </Button>
    </Card>
  );
};
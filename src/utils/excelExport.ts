import * as XLSX from 'xlsx';
import { ProductData, CalculationResult } from '@/components/calculator/types';

export const exportToExcel = (products: ProductData[], calculations: CalculationResult[]) => {
  const workbook = XLSX.utils.book_new();

  const summaryData = calculations.map((calc, idx) => {
    const product = products[idx];
    return {
      'Название товара': calc.productName,
      'Количество': product.quantity,
      'Цена закупки (₽)': product.purchasePrice,
      'Цена продажи (₽)': product.priceBeforeDiscount * (1 - product.discount / 100),
      'Скидка (%)': product.discount,
      '% выкупа': product.redemptionRate,
      'Выручка (₽)': Math.round(calc.revenue),
      'Затраты закупки (₽)': Math.round(calc.costBreakdown.purchase),
      'Комиссия МП (₽)': Math.round(calc.costBreakdown.commission),
      'Упаковка (₽)': Math.round(calc.costBreakdown.packaging),
      'Доставка (₽)': Math.round(calc.costBreakdown.delivery),
      'Прочие затраты (₽)': Math.round(calc.costBreakdown.other),
      'Общие затраты (₽)': Math.round(calc.totalCosts),
      'Валовая прибыль (₽)': Math.round(calc.grossProfit),
      'Чистая прибыль (₽)': Math.round(calc.netProfit),
      'Маржинальность (%)': calc.margin.toFixed(2),
    };
  });

  const summarySheet = XLSX.utils.json_to_sheet(summaryData);

  summarySheet['!cols'] = [
    { wch: 20 },
    { wch: 12 },
    { wch: 15 },
    { wch: 15 },
    { wch: 12 },
    { wch: 12 },
    { wch: 15 },
    { wch: 18 },
    { wch: 15 },
    { wch: 15 },
    { wch: 15 },
    { wch: 18 },
    { wch: 18 },
    { wch: 18 },
    { wch: 18 },
    { wch: 18 },
  ];

  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Сводка');

  const detailedData: Record<string, string | number>[] = [];
  products.forEach((product, idx) => {
    const calc = calculations[idx];
    detailedData.push({
      'Параметр': 'ТОВАР: ' + product.name,
      'Значение': '',
    });
    detailedData.push({ 'Параметр': 'Количество закупаемого товара', 'Значение': product.quantity });
    detailedData.push({ 'Параметр': 'Цена закупки (₽)', 'Значение': product.purchasePrice });
    detailedData.push({ 'Параметр': 'Цена до скидки (₽)', 'Значение': product.priceBeforeDiscount });
    detailedData.push({ 'Параметр': 'Скидка (%)', 'Значение': product.discount });
    detailedData.push({ 'Параметр': 'Комиссия маркетплейса (%)', 'Значение': product.marketplaceCommission });
    detailedData.push({ 'Параметр': 'Затраты на упаковку (₽)', 'Значение': product.packagingCost });
    detailedData.push({ 'Параметр': 'Затраты на услуги подрядчиков (₽)', 'Значение': product.contractorCost });
    detailedData.push({ 'Параметр': 'Услуги фотоконтента (₽)', 'Значение': product.photoContentCost });
    detailedData.push({ 'Параметр': 'Затраты на доставку (₽)', 'Значение': product.deliveryCost });
    detailedData.push({ 'Параметр': '% выкупа по категории', 'Значение': product.redemptionRate });
    detailedData.push({ 'Параметр': 'Хранение на складе за сутки (₽)', 'Значение': product.storageCostPerDay });
    detailedData.push({ 'Параметр': 'Процент УСН (%)', 'Значение': product.taxRate });
    detailedData.push({ 'Параметр': '', 'Значение': '' });
    detailedData.push({ 'Параметр': 'РЕЗУЛЬТАТЫ РАСЧЁТОВ', 'Значение': '' });
    detailedData.push({ 'Параметр': 'Выручка (₽)', 'Значение': Math.round(calc.revenue) });
    detailedData.push({ 'Параметр': 'Валовая прибыль (₽)', 'Значение': Math.round(calc.grossProfit) });
    detailedData.push({ 'Параметр': 'Чистая прибыль (₽)', 'Значение': Math.round(calc.netProfit) });
    detailedData.push({ 'Параметр': 'Маржинальность (%)', 'Значение': calc.margin.toFixed(2) });
    detailedData.push({ 'Параметр': 'Общие затраты (₽)', 'Значение': Math.round(calc.totalCosts) });
    detailedData.push({ 'Параметр': '', 'Значение': '' });
    detailedData.push({ 'Параметр': '', 'Значение': '' });
  });

  const detailedSheet = XLSX.utils.json_to_sheet(detailedData);
  detailedSheet['!cols'] = [{ wch: 40 }, { wch: 20 }];
  XLSX.utils.book_append_sheet(workbook, detailedSheet, 'Детальные данные');

  if (calculations.length > 1) {
    const bestProduct = calculations.reduce((best, current) =>
      current.margin > best.margin ? current : best
    );

    const comparisonData = calculations.map((calc) => ({
      'Товар': calc.productName,
      'Выручка (₽)': Math.round(calc.revenue),
      'Чистая прибыль (₽)': Math.round(calc.netProfit),
      'Маржинальность (%)': calc.margin.toFixed(2),
      'Затраты (₽)': Math.round(calc.totalCosts),
      'Рекомендация': calc.productName === bestProduct.productName ? '⭐ Лучший выбор' : '',
    }));

    const comparisonSheet = XLSX.utils.json_to_sheet(comparisonData);
    comparisonSheet['!cols'] = [{ wch: 25 }, { wch: 15 }, { wch: 18 }, { wch: 18 }, { wch: 15 }, { wch: 20 }];
    XLSX.utils.book_append_sheet(workbook, comparisonSheet, 'Сравнение товаров');
  }

  const date = new Date().toLocaleDateString('ru-RU').replace(/\./g, '-');
  const fileName = `Unit_Экономика_${date}.xlsx`;

  XLSX.writeFile(workbook, fileName);
};
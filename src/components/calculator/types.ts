export interface ProductData {
  id: string;
  name: string;
  quantity: number;
  purchasePrice: number;
  priceBeforeDiscount: number;
  discount: number;
  marketplaceCommission: number;
  packagingCost: number;
  contractorCost: number;
  photoContentCost: number;
  deliveryCost: number;
  redemptionRate: number;
  storageCostPerDay: number;
  taxRate: number;
}

export interface CalculationResult {
  productName: string;
  revenue: number;
  totalCosts: number;
  grossProfit: number;
  netProfit: number;
  margin: number;
  costBreakdown: {
    purchase: number;
    commission: number;
    packaging: number;
    delivery: number;
    other: number;
  };
}
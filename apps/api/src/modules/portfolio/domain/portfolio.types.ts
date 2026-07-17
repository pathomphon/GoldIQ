import type { GoldProductCode } from '../../gold-price/domain/gold-product';

export interface GoldTransaction {
  readonly id: string;
  readonly productCode: GoldProductCode;
  readonly productName: string;
  readonly purchasedAt: Date;
  readonly purchasePrice: number;
  readonly investmentAmount: number;
  readonly goldWeight: number;
  readonly fee: number;
  readonly notes: string | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface GoldTransactionInput {
  readonly productCode: GoldProductCode;
  readonly purchasedAt: Date;
  readonly purchasePrice: number;
  readonly investmentAmount: number;
  readonly goldWeight: number;
  readonly fee: number;
  readonly notes: string | null;
}

export interface CurrentBuyPrice {
  readonly productCode: GoldProductCode;
  readonly buyPrice: number;
}

export interface PortfolioMetrics {
  readonly totalInvested: number;
  readonly totalGoldWeight: number;
  readonly averageCost: number;
  readonly currentValue: number;
  readonly profitLoss: number;
  readonly profitLossPercentage: number;
  readonly breakEvenPrice: number;
  readonly valuedGoldWeight: number;
  readonly unvaluedGoldWeight: number;
}

export interface PortfolioDashboard {
  readonly metrics: PortfolioMetrics;
  readonly transactions: readonly GoldTransaction[];
  readonly valuedAt: Date | null;
}

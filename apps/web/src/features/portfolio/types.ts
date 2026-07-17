import type { GoldProductCode } from '@/features/gold-price/types';

export interface GoldTransaction {
  readonly id: string;
  readonly productCode: GoldProductCode;
  readonly productName: string;
  readonly purchasedAt: string;
  readonly purchasePrice: number;
  readonly investmentAmount: number;
  readonly goldWeight: number;
  readonly fee: number;
  readonly notes: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
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

export interface PortfolioDashboardData {
  readonly metrics: PortfolioMetrics;
  readonly transactions: readonly GoldTransaction[];
  readonly valuedAt: string | null;
}

export interface PortfolioDashboardResult {
  readonly dashboard: PortfolioDashboardData;
  readonly error: string | null;
}

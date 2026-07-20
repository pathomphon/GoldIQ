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
  readonly remainingGoldWeight: number;
  readonly realizedProfitLoss: number;
  readonly status: 'OPEN' | 'PARTIALLY_SOLD' | 'CLOSED';
  readonly sales: readonly GoldSale[];
}

export interface GoldSale {
  readonly id: string;
  readonly purchaseTransactionId: string;
  readonly soldAt: string;
  readonly salePrice: number;
  readonly goldWeight: number;
  readonly fee: number;
  readonly notes: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly grossProceeds: number;
  readonly netProceeds: number;
  readonly allocatedCost: number;
  readonly realizedProfitLoss: number;
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
  readonly realizedProfitLoss: number;
  readonly winRate: number | null;
  readonly winningLots: number;
  readonly losingLots: number;
  readonly breakEvenLots: number;
  readonly closedLots: number;
  readonly openLots: number;
  readonly maxDrawdown?: number;
  readonly positionSizePercentage?: number;
  readonly riskExposurePercentage?: number;
  readonly suggestedBuyAmount?: number;
  readonly suggestedSellAmount?: number;
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

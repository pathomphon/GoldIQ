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
  readonly sales?: readonly GoldSale[];
}

export interface GoldSale {
  readonly id: string;
  readonly purchaseTransactionId: string;
  readonly soldAt: Date;
  readonly salePrice: number;
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

export interface GoldSaleInput {
  readonly purchaseTransactionId: string;
  readonly soldAt: Date;
  readonly salePrice: number;
  readonly goldWeight: number;
  readonly fee: number;
  readonly notes: string | null;
}

export interface GoldSaleUpdateInput {
  readonly soldAt: Date;
  readonly salePrice: number;
  readonly goldWeight: number;
  readonly fee: number;
  readonly notes: string | null;
}

export interface PortfolioSale extends GoldSale {
  readonly grossProceeds: number;
  readonly netProceeds: number;
  readonly allocatedCost: number;
  readonly realizedProfitLoss: number;
}

export interface PortfolioTransaction extends Omit<GoldTransaction, 'sales'> {
  readonly sales: readonly PortfolioSale[];
  readonly remainingGoldWeight: number;
  readonly realizedProfitLoss: number;
  readonly status: 'OPEN' | 'PARTIALLY_SOLD' | 'CLOSED';
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
  readonly realizedProfitLoss: number;
  readonly winRate: number | null;
  readonly winningLots: number;
  readonly losingLots: number;
  readonly breakEvenLots: number;
  readonly closedLots: number;
  readonly openLots: number;
}

export interface PortfolioDashboard {
  readonly metrics: PortfolioMetrics;
  readonly transactions: readonly PortfolioTransaction[];
  readonly valuedAt: Date | null;
}

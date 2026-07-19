import type {
  CurrentBuyPrice,
  GoldSale,
  GoldTransaction,
  PortfolioMetrics,
  PortfolioSale,
  PortfolioTransaction,
} from './portfolio.types';

function round(value: number, digits = 2): number {
  const multiplier = 10 ** digits;
  return Math.round((value + Number.EPSILON) * multiplier) / multiplier;
}

export function calculateGoldWeight(investmentAmount: number, purchasePrice: number): number {
  return round(investmentAmount / purchasePrice, 6);
}

export interface SalePerformance {
  readonly grossProceeds: number;
  readonly netProceeds: number;
  readonly allocatedCost: number;
  readonly realizedProfitLoss: number;
}

export interface TransactionPerformance {
  readonly remainingGoldWeight: number;
  readonly remainingCost: number;
  readonly realizedProfitLoss: number;
  readonly status: 'OPEN' | 'PARTIALLY_SOLD' | 'CLOSED';
}

export function calculateSalePerformance(
  transaction: GoldTransaction,
  sale: GoldSale,
): SalePerformance {
  const grossProceeds = sale.salePrice * sale.goldWeight;
  const totalCost = transaction.investmentAmount + transaction.fee;
  const allocatedCost =
    transaction.goldWeight > 0 ? totalCost * (sale.goldWeight / transaction.goldWeight) : 0;
  const netProceeds = grossProceeds - sale.fee;

  return {
    grossProceeds: round(grossProceeds),
    netProceeds: round(netProceeds),
    allocatedCost: round(allocatedCost),
    realizedProfitLoss: round(netProceeds - allocatedCost),
  };
}

export function calculateTransactionPerformance(
  transaction: GoldTransaction,
): TransactionPerformance {
  const soldWeight = (transaction.sales ?? []).reduce((sum, sale) => sum + sale.goldWeight, 0);
  const remainingGoldWeight = Math.max(0, round(transaction.goldWeight - soldWeight, 6));
  const totalCost = transaction.investmentAmount + transaction.fee;
  const remainingCost =
    transaction.goldWeight > 0 ? totalCost * (remainingGoldWeight / transaction.goldWeight) : 0;
  const realizedProfitLoss = (transaction.sales ?? []).reduce(
    (sum, sale) => sum + calculateSalePerformance(transaction, sale).realizedProfitLoss,
    0,
  );

  return {
    remainingGoldWeight,
    remainingCost: round(remainingCost),
    realizedProfitLoss: round(realizedProfitLoss),
    status: remainingGoldWeight === 0 ? 'CLOSED' : soldWeight > 0 ? 'PARTIALLY_SOLD' : 'OPEN',
  };
}

export function buildPortfolioTransaction(transaction: GoldTransaction): PortfolioTransaction {
  const performance = calculateTransactionPerformance(transaction);
  const sales: readonly PortfolioSale[] = (transaction.sales ?? []).map((sale) => ({
    ...sale,
    ...calculateSalePerformance(transaction, sale),
  }));

  return {
    ...transaction,
    sales,
    remainingGoldWeight: performance.remainingGoldWeight,
    realizedProfitLoss: performance.realizedProfitLoss,
    status: performance.status,
  };
}

export function calculatePortfolioMetrics(
  transactions: readonly GoldTransaction[],
  currentPrices: readonly CurrentBuyPrice[],
): PortfolioMetrics {
  const priceByProduct = new Map(currentPrices.map((price) => [price.productCode, price.buyPrice]));
  let totalInvested = 0;
  let totalGoldWeight = 0;
  let currentValue = 0;
  let valuedGoldWeight = 0;
  let realizedProfitLoss = 0;
  let winningLots = 0;
  let losingLots = 0;
  let breakEvenLots = 0;
  let closedLots = 0;
  let openLots = 0;

  for (const transaction of transactions) {
    const performance = calculateTransactionPerformance(transaction);
    totalInvested += performance.remainingCost;
    totalGoldWeight += performance.remainingGoldWeight;
    realizedProfitLoss += performance.realizedProfitLoss;
    if (performance.status === 'CLOSED') {
      closedLots += 1;
      if (performance.realizedProfitLoss > 0) {
        winningLots += 1;
      } else if (performance.realizedProfitLoss < 0) {
        losingLots += 1;
      } else {
        breakEvenLots += 1;
      }
    } else {
      openLots += 1;
    }
    const currentPrice = priceByProduct.get(transaction.productCode);
    if (currentPrice !== undefined) {
      currentValue += performance.remainingGoldWeight * currentPrice;
      valuedGoldWeight += performance.remainingGoldWeight;
    }
  }

  const profitLoss = currentValue - totalInvested;
  const averageCost = totalGoldWeight > 0 ? totalInvested / totalGoldWeight : 0;

  return {
    totalInvested: round(totalInvested),
    totalGoldWeight: round(totalGoldWeight, 6),
    averageCost: round(averageCost),
    currentValue: round(currentValue),
    profitLoss: round(profitLoss),
    profitLossPercentage: totalInvested > 0 ? round((profitLoss / totalInvested) * 100) : 0,
    breakEvenPrice: round(averageCost),
    valuedGoldWeight: round(valuedGoldWeight, 6),
    unvaluedGoldWeight: round(totalGoldWeight - valuedGoldWeight, 6),
    realizedProfitLoss: round(realizedProfitLoss),
    winRate:
      winningLots + losingLots > 0 ? round((winningLots / (winningLots + losingLots)) * 100) : null,
    winningLots,
    losingLots,
    breakEvenLots,
    closedLots,
    openLots,
  };
}

import type { CurrentBuyPrice, GoldTransaction, PortfolioMetrics } from './portfolio.types';

function round(value: number, digits = 2): number {
  const multiplier = 10 ** digits;
  return Math.round((value + Number.EPSILON) * multiplier) / multiplier;
}

export function calculateGoldWeight(investmentAmount: number, purchasePrice: number): number {
  return round(investmentAmount / purchasePrice, 6);
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

  for (const transaction of transactions) {
    totalInvested += transaction.investmentAmount + transaction.fee;
    totalGoldWeight += transaction.goldWeight;
    const currentPrice = priceByProduct.get(transaction.productCode);
    if (currentPrice !== undefined) {
      currentValue += transaction.goldWeight * currentPrice;
      valuedGoldWeight += transaction.goldWeight;
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
  };
}

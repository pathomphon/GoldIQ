import { describe, expect, it } from 'vitest';

import type { GoldTransaction } from './portfolio.types';
import { calculateGoldWeight, calculatePortfolioMetrics } from './portfolio.calculator';

function transaction(overrides: Partial<GoldTransaction> = {}): GoldTransaction {
  return {
    id: 'transaction-1',
    productCode: 'GOLD_BAR_965',
    productName: 'ทองคำแท่ง 96.5%',
    purchasedAt: new Date('2026-07-01T03:00:00.000Z'),
    purchasePrice: 60_000,
    investmentAmount: 60_000,
    goldWeight: 1,
    fee: 100,
    notes: null,
    createdAt: new Date('2026-07-01T03:00:00.000Z'),
    updatedAt: new Date('2026-07-01T03:00:00.000Z'),
    ...overrides,
  };
}

describe('portfolio calculator', () => {
  it('calculates purchased weight to six decimal places', () => {
    expect(calculateGoldWeight(20_000, 63_300)).toBe(0.315956);
  });

  it('calculates valuation, average cost and profit from current buy price', () => {
    const metrics = calculatePortfolioMetrics(
      [
        transaction(),
        transaction({
          id: 'transaction-2',
          purchasePrice: 62_000,
          investmentAmount: 31_000,
          goldWeight: 0.5,
          fee: 0,
        }),
      ],
      [{ productCode: 'GOLD_BAR_965', buyPrice: 63_000 }],
    );

    expect(metrics).toEqual({
      totalInvested: 91_100,
      totalGoldWeight: 1.5,
      averageCost: 60_733.33,
      currentValue: 94_500,
      profitLoss: 3_400,
      profitLossPercentage: 3.73,
      breakEvenPrice: 60_733.33,
      valuedGoldWeight: 1.5,
      unvaluedGoldWeight: 0,
    });
  });

  it('reports weight that cannot be valued when a current price is missing', () => {
    const metrics = calculatePortfolioMetrics([transaction({ productCode: 'GOLD_9999' })], []);

    expect(metrics.currentValue).toBe(0);
    expect(metrics.unvaluedGoldWeight).toBe(1);
  });
});

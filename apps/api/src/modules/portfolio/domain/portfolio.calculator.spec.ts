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
      realizedProfitLoss: 0,
      winRate: null,
      winningLots: 0,
      losingLots: 0,
      breakEvenLots: 0,
      closedLots: 0,
      openLots: 2,
      maxDrawdown: 0,
      positionSizePercentage: 65.4,
      riskExposurePercentage: 63.04,
      suggestedBuyAmount: 20_000,
      suggestedSellAmount: 23_625,
    });
  });

  it('reports weight that cannot be valued when a current price is missing', () => {
    const metrics = calculatePortfolioMetrics([transaction({ productCode: 'GOLD_9999' })], []);

    expect(metrics.currentValue).toBe(0);
    expect(metrics.unvaluedGoldWeight).toBe(1);
  });

  it('uses only the remaining position for unrealized metrics and reports realized profit', () => {
    const purchase = {
      ...transaction(),
      sales: [
        {
          id: 'sale-1',
          purchaseTransactionId: 'transaction-1',
          soldAt: new Date('2026-07-10T03:00:00.000Z'),
          salePrice: 65_000,
          goldWeight: 0.4,
          fee: 100,
          notes: null,
          createdAt: new Date('2026-07-10T03:00:00.000Z'),
          updatedAt: new Date('2026-07-10T03:00:00.000Z'),
        },
      ],
    } satisfies GoldTransaction;

    expect(
      calculatePortfolioMetrics([purchase], [{ productCode: 'GOLD_BAR_965', buyPrice: 63_000 }]),
    ).toEqual({
      totalInvested: 36_060,
      totalGoldWeight: 0.6,
      averageCost: 60_100,
      currentValue: 37_800,
      profitLoss: 1_740,
      profitLossPercentage: 4.83,
      breakEvenPrice: 60_100,
      valuedGoldWeight: 0.6,
      unvaluedGoldWeight: 0,
      realizedProfitLoss: 1_860,
      winRate: null,
      winningLots: 0,
      losingLots: 0,
      breakEvenLots: 0,
      closedLots: 0,
      openLots: 1,
      maxDrawdown: 0,
      positionSizePercentage: 43.05,
      riskExposurePercentage: 41.07,
      suggestedBuyAmount: 20_000,
      suggestedSellAmount: 9_450,
    });
  });

  it('calculates win rate from winning and losing closed lots while excluding break-even', () => {
    const closedTransaction = (
      id: string,
      salePrice: number,
      saleFee: number,
    ): GoldTransaction => ({
      ...transaction({ id }),
      sales: [
        {
          id: `sale-${id}`,
          purchaseTransactionId: id,
          soldAt: new Date('2026-07-10T03:00:00.000Z'),
          salePrice,
          goldWeight: 1,
          fee: saleFee,
          notes: null,
          createdAt: new Date('2026-07-10T03:00:00.000Z'),
          updatedAt: new Date('2026-07-10T03:00:00.000Z'),
        },
      ],
    });

    const metrics = calculatePortfolioMetrics(
      [
        closedTransaction('winner', 62_000, 100),
        closedTransaction('loser', 59_000, 100),
        closedTransaction('break-even', 60_200, 100),
      ],
      [{ productCode: 'GOLD_BAR_965', buyPrice: 63_000 }],
    );

    expect(metrics.winRate).toBe(50);
    expect(metrics.winningLots).toBe(1);
    expect(metrics.losingLots).toBe(1);
    expect(metrics.breakEvenLots).toBe(1);
    expect(metrics.closedLots).toBe(3);
    expect(metrics.openLots).toBe(0);
    expect(metrics.totalGoldWeight).toBe(0);
  });
});

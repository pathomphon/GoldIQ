import { describe, expect, it } from 'vitest';

import { buildRecommendation } from './recommendation.engine';
import type { RecommendationContext, RiskSettings } from './recommendation.types';

const settings: RiskSettings = {
  riskProfile: 'BALANCED',
  availableCash: 50_000,
  minimumCashReserve: 10_000,
  maxAllocationPercent: 50,
  profitTargetPercent: 5,
  sellPartialPercent: 25,
  stopBuyAbovePrice: 65_000,
};

const market: RecommendationContext = {
  observedAt: new Date('2026-07-19T10:00:00Z'),
  currentBuyPrice: 63_000,
  currentSellPrice: 63_100,
  totalInvested: 20_000,
  totalGoldWeight: 0.316,
  averageCost: 63_291,
  currentValue: 19_908,
  profitLossPercentage: -0.46,
  nextBuyLevel: {
    targetPrice: 63_100,
    investmentAmount: 15_000,
    sequence: 2,
    planName: 'แผนหลัก',
  },
};

describe('buildRecommendation', () => {
  it('recommends buying when price crosses a level and cash is sufficient', () => {
    const result = buildRecommendation(market, settings);
    expect(['BUY', 'STRONG_BUY']).toContain(result.action);
    expect(result.recommendedAmount).toBe(15_000);
    expect(result.allocation.deployableCash).toBe(25_000);
    expect(result.why).toBeDefined();
    expect(result.confidence).toBeGreaterThan(0);
    expect(result.risk).toBeDefined();
    expect(result.evidence).toBeDefined();
  });

  it('waits when the reserve leaves insufficient cash', () => {
    const result = buildRecommendation(market, {
      ...settings,
      availableCash: 12_000,
      minimumCashReserve: 10_000,
    });
    expect(result.action).toBe('WAIT');
    expect(result.recommendedAmount).toBe(2_000);
  });

  it('prioritizes taking profit over buying', () => {
    const result = buildRecommendation({ ...market, profitLossPercentage: 6 }, settings);
    expect(result.action).toBe('SELL');
    expect(result.sellPartialPercent).toBe(25);
  });

  it('recommends strong sell when profit is significantly higher than target', () => {
    const result = buildRecommendation({ ...market, profitLossPercentage: 8 }, settings);
    expect(result.action).toBe('STRONG_SELL');
    expect(result.confidence).toBe(95);
  });

  it('stops buying above the configured ceiling', () => {
    const result = buildRecommendation({ ...market, currentSellPrice: 65_100 }, settings);
    expect(result.action).toBe('HOLD');
    expect(result.recommendedAmount).toBe(0);
  });
});

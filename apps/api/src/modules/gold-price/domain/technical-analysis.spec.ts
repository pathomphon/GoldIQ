import { describe, expect, it } from 'vitest';

import type { GoldPriceSnapshot } from './gold-price.types';
import { calculateTechnicalAnalysis } from './technical-analysis';

const history: GoldPriceSnapshot[] = Array.from({ length: 40 }, (_, index) => ({
  id: `price-${index}`,
  productCode: 'GOLD_BAR_965',
  productName: 'Gold bar',
  purity: 96.5,
  buyPrice: 63_000 + index * 10,
  sellPrice: 63_100 + index * 10,
  buyChange: 10,
  sellChange: 10,
  source: 'HUA_SENG_HENG',
  sourceUpdatedAt: new Date(Date.UTC(2026, 6, 1, 0, index)),
  fetchedAt: new Date(Date.UTC(2026, 6, 1, 0, index)),
  rawResponseHash: String(index).padStart(64, '0'),
}));

describe('calculateTechnicalAnalysis', () => {
  it('calculates indicators and levels from chronological sell prices', () => {
    const result = calculateTechnicalAnalysis('GOLD_BAR_965', history.toReversed());

    expect(result.samples).toHaveLength(40);
    expect(result.sma['20']).toBeGreaterThan(63_100);
    expect(result.sma['50']).toBeNull();
    expect(result.ema['20']).toBeGreaterThan(63_100);
    expect(result.ema['50']).toBeNull();
    expect(result.rsi).toBe(100);
    expect(result.macd).not.toBeNull();
    expect(result.bollingerBands).not.toBeNull();
    expect(result.bollingerBands?.middle).toBeGreaterThan(63_100);
    expect(result.bollingerBands?.upper).toBeGreaterThan(result.bollingerBands?.lower ?? 0);
    expect(result.atr).toBeGreaterThan(0);
    expect(result.pivotPoints).not.toBeNull();
    expect(result.pivotPoints?.pivot).toBeGreaterThan(63_000);
    expect(result.support).toEqual([63_100, 63_110, 63_120]);
    expect(result.resistance).toEqual([63_490, 63_480, 63_470]);
  });
});

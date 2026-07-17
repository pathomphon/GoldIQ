import { describe, expect, it } from 'vitest';

import { findTriggeredLevels } from './buy-plan.evaluator';
import type { WaitingBuyLevel } from './buy-plan.types';

const level: WaitingBuyLevel = {
  id: 'level-1',
  planName: 'Main plan',
  productCode: 'GOLD_BAR_965',
  sequence: 1,
  targetPrice: 63_300,
  investmentAmount: 20_000,
};

describe('findTriggeredLevels', () => {
  it('triggers when the current sell price reaches the target', () => {
    const result = findTriggeredLevels(
      [level],
      [{ productCode: 'GOLD_BAR_965', sellPrice: 63_300 }],
    );
    expect(result).toHaveLength(1);
    expect(result[0]?.observedPrice).toBe(63_300);
  });

  it('does not trigger above the target or for another product', () => {
    expect(
      findTriggeredLevels(
        [level],
        [
          { productCode: 'GOLD_BAR_965', sellPrice: 63_301 },
          { productCode: 'GOLD_9999', sellPrice: 60_000 },
        ],
      ),
    ).toHaveLength(0);
  });
});

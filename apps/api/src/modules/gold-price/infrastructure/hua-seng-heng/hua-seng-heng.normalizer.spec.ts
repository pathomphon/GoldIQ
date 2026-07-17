import { describe, expect, it } from 'vitest';

import { normalizeHuaSengHengResponses } from './hua-seng-heng.normalizer';

const raw965 = [
  {
    GoldType: 'HSH',
    GoldCode: '96.50',
    Buy: '63,550',
    Sell: '63,640',
    TimeUpdate: '2026-07-17T21:21:41',
    BuyChange: -20,
    SellChange: -20,
  },
  {
    GoldType: 'JEWEL',
    GoldCode: '96.50',
    Buy: '62,231.8',
    Sell: '64,500',
    TimeUpdate: '2026-07-17T21:21:44',
    BuyChange: 0,
    SellChange: 0,
  },
];

const raw9999 = {
  Buy: '65,890',
  Sell: '65,965',
  TimeUpdate: '2026-07-17T21:21:44.82',
};

describe('normalizeHuaSengHengResponses', () => {
  it('converts provider-specific payloads into three domain quotes', () => {
    const quotes = normalizeHuaSengHengResponses(
      raw965,
      raw9999,
      new Date('2026-07-17T14:22:00.000Z'),
    );

    expect(quotes.map((quote) => quote.productCode)).toEqual([
      'GOLD_BAR_965',
      'GOLD_ORNAMENT_965',
      'GOLD_9999',
    ]);
    expect(quotes[0]).toMatchObject({
      buyPrice: 63_550,
      sellPrice: 63_640,
      buyChange: -20,
      source: 'HUA_SENG_HENG',
    });
    expect(quotes[0]?.sourceUpdatedAt.toISOString()).toBe('2026-07-17T14:21:41.000Z');
    expect(quotes[2]?.buyPrice).toBe(65_890);
    expect(quotes.every((quote) => quote.rawResponseHash.length === 64)).toBe(true);
  });

  it('rejects malformed or incomplete provider payloads', () => {
    expect(() => normalizeHuaSengHengResponses([], raw9999)).toThrowError(
      'missing required products',
    );
  });
});

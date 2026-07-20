import { describe, expect, it } from 'vitest';

import {
  normalizeFinnomenaGoldSpotReference,
  normalizeFinnomenaThaiGoldReference,
} from './finnomena-market-reference.normalizer';

const fetchedAt = new Date('2026-07-19T10:00:00.000Z');

describe('FINNOMENA market reference normalizer', () => {
  it('normalizes Thai retail gold as secondary research evidence', () => {
    const articles = normalizeFinnomenaThaiGoldReference(
      {
        statusOK: true,
        data: {
          createdAt: '2026-07-19T09:02:00Z',
          createdTime: '3',
          createdDateTime: '20260719_3',
          barBuyPrice: '63,850.00',
          barSellPrice: '64,050.00',
          barPriceChange: '-350.00',
          ornamentBuyPrice: '62,580.48',
          ornamentSellPrice: '64,850.00',
        },
      },
      fetchedAt,
    );

    expect(articles).toHaveLength(1);
    expect(articles[0]).toMatchObject({
      source: 'FINNOMENA.COM',
      externalId: 'finnomena-thai-gold:20260719_3',
      sourceTier: 'SECONDARY',
      publishedAt: new Date('2026-07-19T09:02:00Z'),
    });
    expect(articles[0]?.canonicalUrl).toContain('reference=thai-gold');
    expect(articles[0]?.excerpt).toContain('63850.00');
    expect(articles[0]?.excerpt).toContain('-350.00');
  });

  it('normalizes the latest Gold Spot session as secondary research evidence', () => {
    const articles = normalizeFinnomenaGoldSpotReference(
      {
        statusOK: true,
        data: {
          results: [
            {
              T: 'C:XAUUSD',
              d: '2026-07-18',
              o: 3985.16,
              h: 4023.33,
              l: 3960.75,
              c: 4010.59,
              t: Date.parse('2026-07-18T00:00:00Z'),
            },
          ],
        },
      },
      fetchedAt,
    );

    expect(articles).toHaveLength(1);
    expect(articles[0]).toMatchObject({
      source: 'FINNOMENA.COM',
      externalId: `finnomena-gold-spot:${Date.parse('2026-07-18T00:00:00Z')}`,
      sourceTier: 'SECONDARY',
    });
    expect(articles[0]?.canonicalUrl).toContain('reference=gold-spot');
    expect(articles[0]?.excerpt).toContain('4010.59');
  });

  it('rejects malformed or future-dated data', () => {
    expect(() =>
      normalizeFinnomenaThaiGoldReference(
        {
          statusOK: true,
          data: {
            createdAt: '2026-07-20T09:02:00Z',
            createdTime: '1',
            createdDateTime: '20260720_1',
            barBuyPrice: 'invalid',
            barSellPrice: '64,050.00',
            barPriceChange: '0',
            ornamentBuyPrice: '62,580.48',
            ornamentSellPrice: '64,850.00',
          },
        },
        fetchedAt,
      ),
    ).toThrow();
  });
});

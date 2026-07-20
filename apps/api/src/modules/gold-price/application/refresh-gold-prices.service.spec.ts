import { describe, expect, it, vi } from 'vitest';

import type { GoldPriceProviderPort } from '../domain/gold-price-provider.port';
import type { GoldPriceRepositoryPort } from '../domain/gold-price-repository.port';
import type { NormalizedGoldPriceQuote } from '../domain/gold-price.types';
import { RefreshGoldPricesService } from './refresh-gold-prices.service';

const quote: NormalizedGoldPriceQuote = {
  productCode: 'GOLD_BAR_965',
  buyPrice: 63_550,
  sellPrice: 63_640,
  buyChange: -20,
  sellChange: -20,
  source: 'HUA_SENG_HENG',
  sourceUpdatedAt: new Date('2026-07-17T14:21:41.000Z'),
  fetchedAt: new Date('2026-07-17T14:22:00.000Z'),
  rawResponseHash: 'a'.repeat(64),
};

describe('RefreshGoldPricesService', () => {
  it('fetches normalized quotes and persists them', async () => {
    const fetchCurrentPrices = vi.fn().mockResolvedValue([quote]);
    const saveQuotes = vi.fn().mockResolvedValue({
      received: 1,
      inserted: 1,
      duplicates: 0,
    });
    const upsertCandles = vi.fn().mockResolvedValue(undefined);
    const provider: GoldPriceProviderPort = {
      fetchCurrentPrices,
    };
    const repository: GoldPriceRepositoryPort = {
      saveQuotes,
      upsertCandles,
      findCurrentPrices: vi.fn(),
      findHistory: vi.fn(),
      findCandles: vi.fn(),
      purgeOldRawPrices: vi.fn(),
    };
    const service = new RefreshGoldPricesService(provider, repository);

    await expect(service.execute()).resolves.toEqual({
      received: 1,
      inserted: 1,
      duplicates: 0,
    });
    expect(fetchCurrentPrices).toHaveBeenCalledOnce();
    expect(saveQuotes).toHaveBeenCalledWith([quote]);
    expect(upsertCandles).toHaveBeenCalledWith([quote]);
  });
});

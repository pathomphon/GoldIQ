import { describe, expect, it, vi, beforeEach } from 'vitest';
import { GetGoldPriceCandlesService } from './get-gold-price-candles.service';
import type { GoldPriceRepositoryPort } from '../domain/gold-price-repository.port';
import { getBucketStart } from '../infrastructure/persistence/prisma-gold-price.repository';

describe('getBucketStart', () => {
  const sampleDate = new Date('2026-07-20T14:37:45.123Z');

  it('floors to 1-minute bucket', () => {
    const bucket = getBucketStart(sampleDate, 'M1');
    expect(bucket.toISOString()).toBe('2026-07-20T14:37:00.000Z');
  });

  it('floors to 5-minute bucket', () => {
    const bucket = getBucketStart(sampleDate, 'M5');
    expect(bucket.toISOString()).toBe('2026-07-20T14:35:00.000Z');
  });

  it('floors to 15-minute bucket', () => {
    const bucket = getBucketStart(sampleDate, 'M15');
    expect(bucket.toISOString()).toBe('2026-07-20T14:30:00.000Z');
  });

  it('floors to 1-hour bucket', () => {
    const bucket = getBucketStart(sampleDate, 'H1');
    expect(bucket.toISOString()).toBe('2026-07-20T14:00:00.000Z');
  });

  it('floors to 1-day bucket', () => {
    const bucket = getBucketStart(sampleDate, 'D1');
    expect(bucket.toISOString()).toBe('2026-07-20T00:00:00.000Z');
  });
});

describe('GetGoldPriceCandlesService', () => {
  let service: GetGoldPriceCandlesService;
  let findCandlesMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    findCandlesMock = vi.fn().mockResolvedValue([]);
    const mockRepository: GoldPriceRepositoryPort = {
      saveQuotes: vi.fn(),
      upsertCandles: vi.fn(),
      findCurrentPrices: vi.fn(),
      findHistory: vi.fn(),
      findCandles: findCandlesMock,
      purgeOldRawPrices: vi.fn(),
    };

    service = new GetGoldPriceCandlesService(mockRepository);
  });

  it('queries candles with defaults', async () => {
    await service.execute({});

    expect(findCandlesMock).toHaveBeenCalledWith({
      productCode: 'GOLD_BAR_965',
      resolution: 'M1',
      from: undefined,
      to: undefined,
      limit: 500,
    });
  });

  it('maps timeframe INTRADAY to M1 resolution and past 24 hours', async () => {
    await service.execute({ timeframe: 'INTRADAY' });

    const expectedDate = expect.any(Date) as unknown as Date;
    expect(findCandlesMock).toHaveBeenCalledWith(
      expect.objectContaining({
        productCode: 'GOLD_BAR_965',
        resolution: 'M1',
        from: expectedDate,
      }),
    );
  });

  it('maps timeframe 7D to H1 resolution', async () => {
    await service.execute({ timeframe: '7D' });

    const expectedDate = expect.any(Date) as unknown as Date;
    expect(findCandlesMock).toHaveBeenCalledWith(
      expect.objectContaining({
        resolution: 'H1',
        from: expectedDate,
      }),
    );
  });
});

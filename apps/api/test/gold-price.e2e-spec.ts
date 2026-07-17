import { ValidationPipe, type INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import type { Server } from 'node:http';
import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { GetCurrentGoldPricesService } from '../src/modules/gold-price/application/get-current-gold-prices.service';
import { GetGoldPriceHistoryService } from '../src/modules/gold-price/application/get-gold-price-history.service';
import { GoldPriceController } from '../src/modules/gold-price/presentation/gold-price.controller';

const currentPrice = {
  id: 'price-1',
  productCode: 'GOLD_BAR_965' as const,
  productName: 'ทองคำแท่ง 96.5%',
  purity: 96.5,
  buyPrice: 63_550,
  sellPrice: 63_640,
  buyChange: -20,
  sellChange: -20,
  source: 'HUA_SENG_HENG' as const,
  sourceUpdatedAt: new Date('2026-07-17T14:21:41.000Z'),
  fetchedAt: new Date('2026-07-17T14:22:00.000Z'),
  rawResponseHash: 'a'.repeat(64),
};

describe('Gold price API (integration)', () => {
  let app: INestApplication | undefined;
  const current = { execute: vi.fn().mockResolvedValue([currentPrice]) };
  const history = { execute: vi.fn().mockResolvedValue([currentPrice]) };

  beforeEach(async () => {
    vi.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      controllers: [GoldPriceController],
      providers: [
        { provide: GetCurrentGoldPricesService, useValue: current },
        { provide: GetGoldPriceHistoryService, useValue: history },
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(
      new ValidationPipe({
        forbidNonWhitelisted: true,
        transform: true,
        whitelist: true,
      }),
    );
    await app.init();
  });

  afterEach(async () => {
    await app?.close();
  });

  it('returns current prices and filtered history', async () => {
    if (!app) {
      throw new Error('Test application was not initialized');
    }
    const httpServer = app.getHttpServer() as Server;

    await request(httpServer)
      .get('/api/v1/gold-prices/current')
      .expect(200)
      .expect(({ body }: { body: { data: unknown[] } }) => {
        expect(body.data).toHaveLength(1);
      });

    await request(httpServer)
      .get('/api/v1/gold-prices/history?productCode=GOLD_BAR_965&limit=25')
      .expect(200);
    expect(history.execute).toHaveBeenCalledWith('GOLD_BAR_965', 25);
  });

  it('rejects unsupported product codes', async () => {
    if (!app) {
      throw new Error('Test application was not initialized');
    }

    await request(app.getHttpServer() as Server)
      .get('/api/v1/gold-prices/history?productCode=UNKNOWN')
      .expect(400);

    await request(app.getHttpServer() as Server)
      .get('/api/v1/gold-prices/history?limit=0')
      .expect(400);
  });
});

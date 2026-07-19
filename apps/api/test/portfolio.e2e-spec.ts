import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import type { Server } from 'node:http';
import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { CreateGoldTransactionService } from '../src/modules/portfolio/application/create-gold-transaction.service';
import { CreateGoldSaleService } from '../src/modules/portfolio/application/create-gold-sale.service';
import { DeleteGoldSaleService } from '../src/modules/portfolio/application/delete-gold-sale.service';
import { DeleteGoldTransactionService } from '../src/modules/portfolio/application/delete-gold-transaction.service';
import { GetPortfolioDashboardService } from '../src/modules/portfolio/application/get-portfolio-dashboard.service';
import { UpdateGoldSaleService } from '../src/modules/portfolio/application/update-gold-sale.service';
import { UpdateGoldTransactionService } from '../src/modules/portfolio/application/update-gold-transaction.service';
import { PortfolioController } from '../src/modules/portfolio/presentation/portfolio.controller';

const storedTransaction = {
  id: 'transaction-1',
  productCode: 'GOLD_BAR_965' as const,
  productName: 'ทองคำแท่ง 96.5%',
  purchasedAt: new Date('2026-07-01T03:00:00.000Z'),
  purchasePrice: 63_300,
  investmentAmount: 20_000,
  goldWeight: 0.315956,
  fee: 0,
  notes: null,
  createdAt: new Date('2026-07-01T03:00:00.000Z'),
  updatedAt: new Date('2026-07-01T03:00:00.000Z'),
};

describe('Portfolio API (integration)', () => {
  let app: INestApplication | undefined;
  const dashboard = {
    execute: vi.fn().mockResolvedValue({
      metrics: {
        totalInvested: 20_000,
        totalGoldWeight: 0.315956,
        averageCost: 63_300,
        currentValue: 20_076,
        profitLoss: 76,
        profitLossPercentage: 0.38,
        breakEvenPrice: 63_300,
        valuedGoldWeight: 0.315956,
        unvaluedGoldWeight: 0,
      },
      transactions: [storedTransaction],
      valuedAt: new Date('2026-07-17T14:40:00.000Z'),
    }),
  };
  const create = { execute: vi.fn().mockResolvedValue(storedTransaction) };
  const update = { execute: vi.fn().mockResolvedValue(storedTransaction) };
  const remove = { execute: vi.fn().mockResolvedValue(undefined) };
  const createSale = { execute: vi.fn().mockResolvedValue({ id: 'sale-1' }) };
  const updateSale = { execute: vi.fn().mockResolvedValue({ id: 'sale-1' }) };
  const deleteSale = { execute: vi.fn().mockResolvedValue(undefined) };

  beforeEach(async () => {
    vi.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      controllers: [PortfolioController],
      providers: [
        { provide: GetPortfolioDashboardService, useValue: dashboard },
        { provide: CreateGoldTransactionService, useValue: create },
        { provide: UpdateGoldTransactionService, useValue: update },
        { provide: DeleteGoldTransactionService, useValue: remove },
        { provide: CreateGoldSaleService, useValue: createSale },
        { provide: UpdateGoldSaleService, useValue: updateSale },
        { provide: DeleteGoldSaleService, useValue: deleteSale },
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api/v1');
    await app.init();
  });

  afterEach(async () => {
    await app?.close();
  });

  it('exposes the portfolio dashboard and transaction mutations', async () => {
    if (!app) {
      throw new Error('Test application was not initialized');
    }
    const httpServer = app.getHttpServer() as Server;

    await request(httpServer)
      .get('/api/v1/portfolio')
      .expect(200)
      .expect(({ body }: { body: { transactions: unknown[] } }) => {
        expect(body.transactions).toHaveLength(1);
      });

    await request(httpServer)
      .post('/api/v1/portfolio/transactions')
      .send({
        productCode: 'GOLD_BAR_965',
        purchasedAt: '2026-07-01T03:00:00.000Z',
        purchasePrice: 63_300,
        investmentAmount: 20_000,
        fee: 0,
      })
      .expect(201);

    await request(httpServer)
      .post('/api/v1/portfolio/sales')
      .send({
        purchaseTransactionId: 'transaction-1',
        soldAt: '2026-07-10T03:00:00.000Z',
        salePrice: 65_000,
        goldWeight: 0.1,
        fee: 50,
      })
      .expect(201);

    await request(httpServer).patch('/api/v1/portfolio/sales/sale-1').send({ fee: 75 }).expect(200);

    await request(httpServer).delete('/api/v1/portfolio/sales/sale-1').expect(204);

    await request(httpServer)
      .patch('/api/v1/portfolio/transactions/transaction-1')
      .send({ fee: 100 })
      .expect(200);

    await request(httpServer).delete('/api/v1/portfolio/transactions/transaction-1').expect(204);
  });
});

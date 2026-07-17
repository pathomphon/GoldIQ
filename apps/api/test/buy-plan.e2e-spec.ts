import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import type { Server } from 'node:http';
import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { BuyPlanService } from '../src/modules/buy-plan/application/buy-plan.service';
import { BuyPlanController } from '../src/modules/buy-plan/presentation/buy-plan.controller';

describe('Buy Plan API (integration)', () => {
  let app: INestApplication | undefined;
  const plan = {
    id: 'plan-1',
    name: 'Main plan',
    productCode: 'GOLD_BAR_965' as const,
    productName: 'Gold bar 96.5%',
    isActive: true,
    createdAt: new Date(),
    levels: [
      {
        id: 'level-1',
        targetPrice: 63_300,
        investmentAmount: 20_000,
        sequence: 1,
        status: 'WAITING' as const,
        triggeredAt: null,
        executedAt: null,
      },
    ],
  };
  const service = {
    dashboard: vi.fn().mockResolvedValue({ plans: [plan], recentAlerts: [] }),
    create: vi.fn().mockResolvedValue(plan),
    updateLevelStatus: vi.fn().mockResolvedValue(undefined),
    delete: vi.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      controllers: [BuyPlanController],
      providers: [{ provide: BuyPlanService, useValue: service }],
    }).compile();
    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api/v1');
    await app.init();
  });

  afterEach(async () => app?.close());

  it('exposes plan dashboard and mutations', async () => {
    if (!app) throw new Error('Test application was not initialized');
    const server = app.getHttpServer() as Server;
    await request(server)
      .get('/api/v1/buy-plans')
      .expect(200)
      .expect(({ body }: { body: { plans: unknown[] } }) => {
        expect(body.plans).toHaveLength(1);
      });
    await request(server)
      .post('/api/v1/buy-plans')
      .send({
        name: 'Main plan',
        productCode: 'GOLD_BAR_965',
        levels: [{ targetPrice: 63_300, investmentAmount: 20_000, sequence: 1 }],
      })
      .expect(201);
    await request(server)
      .patch('/api/v1/buy-plans/levels/level-1')
      .send({ status: 'EXECUTED' })
      .expect(204);
    await request(server).delete('/api/v1/buy-plans/plan-1').expect(204);
  });
});

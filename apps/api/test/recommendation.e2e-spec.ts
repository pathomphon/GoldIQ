import { ValidationPipe, type INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import type { Server } from 'node:http';
import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { validate } from 'class-validator';

import { RecommendationService } from '../src/modules/recommendation/application/recommendation.service';
import { RecommendationController } from '../src/modules/recommendation/presentation/recommendation.controller';
import { UpdateRiskSettingsDto } from '../src/modules/recommendation/presentation/dto/update-risk-settings.dto';

const settings = {
  riskProfile: 'BALANCED' as const,
  availableCash: 50_000,
  minimumCashReserve: 10_000,
  maxAllocationPercent: 50,
  profitTargetPercent: 5,
  sellPartialPercent: 25,
  stopBuyAbovePrice: null,
};

describe('Recommendation API (integration)', () => {
  let app: INestApplication | undefined;
  const service = {
    getRecommendation: vi.fn().mockResolvedValue({ action: 'WAIT', reasons: [] }),
    getSettings: vi.fn().mockResolvedValue(settings),
    updateSettings: vi.fn().mockResolvedValue(settings),
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      controllers: [RecommendationController],
      providers: [{ provide: RecommendationService, useValue: service }],
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

  it('returns the current recommendation and settings', async () => {
    if (!app) throw new Error('Test application was not initialized');
    const server = app.getHttpServer() as Server;
    await request(server).get('/api/v1/recommendations/current').expect(200);
    await request(server).get('/api/v1/recommendations/settings').expect(200);
  });

  it('validates and updates risk settings', async () => {
    if (!app) throw new Error('Test application was not initialized');
    const server = app.getHttpServer() as Server;
    await request(server).patch('/api/v1/recommendations/settings').send(settings).expect(200);
    expect(service.updateSettings).toHaveBeenCalledWith(settings);

    const invalid = Object.assign(new UpdateRiskSettingsDto(), {
      ...settings,
      maxAllocationPercent: 101,
    });
    expect(await validate(invalid)).not.toHaveLength(0);
  });
});

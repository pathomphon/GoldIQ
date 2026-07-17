import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import type { Server } from 'node:http';
import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  CACHE_HEALTH_PORT,
  DATABASE_HEALTH_PORT,
  type DependencyHealthPort,
} from '../src/modules/health/domain/dependency-health.port';
import { HealthService } from '../src/modules/health/application/health.service';
import { HealthController } from '../src/modules/health/presentation/health.controller';

describe('Health API (integration)', () => {
  let app: INestApplication | undefined;

  beforeEach(async () => {
    const port: DependencyHealthPort = { ping: vi.fn().mockResolvedValue(undefined) };
    const moduleRef = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        HealthService,
        { provide: DATABASE_HEALTH_PORT, useValue: port },
        { provide: CACHE_HEALTH_PORT, useValue: port },
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api/v1');
    await app.init();
  });

  afterEach(async () => {
    await app?.close();
  });

  it('exposes liveness and readiness endpoints', async () => {
    if (!app) {
      throw new Error('Test application was not initialized');
    }

    const httpServer = app.getHttpServer() as Server;

    await request(httpServer)
      .get('/api/v1/health/liveness')
      .expect(200)
      .expect(({ body }: { body: { status: string; service: string } }) => {
        expect(body).toMatchObject({ status: 'ok', service: 'goldiq-api' });
      });

    await request(httpServer)
      .get('/api/v1/health/readiness')
      .expect(200)
      .expect(({ body }: { body: { status: string; checks: unknown[] } }) => {
        expect(body.status).toBe('ok');
        expect(body.checks).toHaveLength(3);
      });
  });
});

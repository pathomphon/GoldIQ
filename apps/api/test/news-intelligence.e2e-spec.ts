import { ValidationPipe, type INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import type { Server } from 'node:http';
import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { AnalyzeArticleService } from '../src/modules/news-intelligence/application/analyze-article.service';
import { GetNewsService } from '../src/modules/news-intelligence/application/get-news.service';
import { GetNewsAgentStatusService } from '../src/modules/news-intelligence/application/get-news-agent-status.service';
import { GetLatestMarketBriefService } from '../src/modules/news-intelligence/application/get-latest-market-brief.service';
import { NewsIntelligenceController } from '../src/modules/news-intelligence/presentation/news-intelligence.controller';

describe('News intelligence API (integration)', () => {
  let app: INestApplication | undefined;
  const getNews = {
    execute: vi.fn().mockResolvedValue([
      {
        id: 'news-1',
        source: 'FEDERALRESERVE.GOV',
        canonicalUrl: 'https://www.federalreserve.gov/news/one',
        title: 'Policy update',
        excerpt: null,
        sourceTier: 'PRIMARY',
        publishedAt: new Date('2026-07-19T09:00:00Z'),
        fetchedAt: new Date('2026-07-19T10:00:00Z'),
      },
    ]),
  };
  const getLatestBrief = { execute: vi.fn().mockResolvedValue(null) };
  const getAgentStatus = {
    execute: vi.fn().mockResolvedValue({
      newsScheduler: { enabled: true, cron: '0 */15 * * * *', lockTtlMs: 120000 },
      researchAgentScheduler: { enabled: true, cron: '0 5 * * * *', lockTtlMs: 120000 },
      provider: {
        activeProvider: 'ollama',
        model: 'qwen2.5-coder:latest',
        ollamaBaseUrl: 'http://localhost:11434',
        ollamaStatus: 'UP',
        ollamaLatencyMs: 10,
        ollamaVersion: '0.5.1',
        openAiConfigured: false,
      },
      latestBrief: { status: 'UNAVAILABLE' },
    }),
  };
  const analyzeArticle = {
    execute: vi.fn().mockResolvedValue({
      id: 'news-1',
      title: 'Policy update',
      analysis: {
        relevant: true,
        category: 'FED',
        goldImpact: 'BULLISH',
      },
    }),
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      controllers: [NewsIntelligenceController],
      providers: [
        { provide: GetNewsService, useValue: getNews },
        { provide: GetLatestMarketBriefService, useValue: getLatestBrief },
        { provide: GetNewsAgentStatusService, useValue: getAgentStatus },
        { provide: AnalyzeArticleService, useValue: analyzeArticle },
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

  it('returns source-filtered news with a bounded limit', async () => {
    if (!app) throw new Error('Test application was not initialized');

    await request(app.getHttpServer() as Server)
      .get('/api/v1/news?source=FEDERALRESERVE.GOV&limit=20')
      .expect(200)
      .expect(({ body }: { body: { data: unknown[] } }) => {
        expect(body.data).toHaveLength(1);
      });
    expect(getNews.execute).toHaveBeenCalledWith(20, 'FEDERALRESERVE.GOV');
  });

  it('returns an explicit unavailable state before the first brief exists', async () => {
    if (!app) throw new Error('Test application was not initialized');

    await request(app.getHttpServer() as Server)
      .get('/api/v1/news/brief/latest')
      .expect(200)
      .expect({ data: null, status: 'UNAVAILABLE' });
  });

  it('returns agent status with provider and scheduler info', async () => {
    if (!app) throw new Error('Test application was not initialized');

    await request(app.getHttpServer() as Server)
      .get('/api/v1/news/agent-status')
      .expect(200)
      .expect(({ body }: { body: { provider: { activeProvider: string } } }) => {
        expect(body.provider.activeProvider).toBe('ollama');
      });
  });

  it('analyzes single article by ID', async () => {
    if (!app) throw new Error('Test application was not initialized');

    await request(app.getHttpServer() as Server)
      .post('/api/v1/news/news-1/analyze')
      .expect(200)
      .expect(({ body }: { body: { data: { id: string } } }) => {
        expect(body.data.id).toBe('news-1');
      });

    expect(analyzeArticle.execute).toHaveBeenCalledWith('news-1');
  });

  it('rejects invalid limits and unknown query fields', async () => {
    if (!app) throw new Error('Test application was not initialized');
    const server = app.getHttpServer() as Server;

    await request(server).get('/api/v1/news?limit=0').expect(400);
    await request(server).get('/api/v1/news?unexpected=true').expect(400);
  });
});

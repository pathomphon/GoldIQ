import type { ConfigService } from '@nestjs/config';
import { describe, expect, it, vi } from 'vitest';

import type { AppEnvironment } from '../../../config/environment.schema';
import type { NewsAnalyzerPort } from '../domain/news-analyzer.port';
import type { NewsRepositoryPort } from '../domain/news-repository.port';
import type { MarketBrief, MarketBriefAnalysis, NewsArticle } from '../domain/news.types';
import { GenerateMarketBriefService } from './generate-market-brief.service';

const now = new Date('2026-07-19T10:00:00Z');
const article: NewsArticle = {
  id: 'news-1',
  source: 'FEDERALRESERVE.GOV',
  canonicalUrl: 'https://www.federalreserve.gov/news/one',
  title: 'Policy update',
  excerpt: null,
  sourceTier: 'PRIMARY',
  publishedAt: new Date('2026-07-19T09:00:00Z'),
  fetchedAt: new Date('2026-07-19T09:05:00Z'),
};
const analysis: MarketBriefAnalysis = {
  stance: 'NEUTRAL',
  summary: 'Evidence is mixed.',
  bullishFactors: [{ text: 'Supportive factor', evidenceIds: ['news-1'] }],
  bearishFactors: [],
  riskFlags: [],
  unknowns: [],
  evidenceIds: ['news-1'],
  provider: 'OPENAI',
  model: 'test-model',
  promptVersion: 'test-v1',
  responseId: 'resp-1',
};

function config(): ConfigService<AppEnvironment, true> {
  const values: Record<string, unknown> = {
    'researchAgent.windowHours': 168,
    'researchAgent.maxArticles': 40,
    'researchAgent.briefTtlMinutes': 60,
  };
  return {
    get: vi.fn((key: string) => values[key]),
  } as unknown as ConfigService<AppEnvironment, true>;
}

describe('GenerateMarketBriefService', () => {
  it('validates citations, computes bounded confidence, and persists cited evidence only', async () => {
    const analyzer: NewsAnalyzerPort = { analyze: vi.fn().mockResolvedValue(analysis) };
    const saveBrief = vi.fn((input: Parameters<NewsRepositoryPort['saveBrief']>[0]) =>
      Promise.resolve({
        id: 'brief-1',
        generatedAt: now,
        isStale: false,
        evidence: [article],
        ...input.analysis,
        confidence: input.confidence,
        windowStart: input.windowStart,
        windowEnd: input.windowEnd,
        expiresAt: input.expiresAt,
      } satisfies MarketBrief),
    );
    const repository: NewsRepositoryPort = {
      saveArticles: vi.fn(),
      findArticles: vi.fn(),
      findAnalysisCandidates: vi.fn().mockResolvedValue([article]),
      findLatestBrief: vi.fn().mockResolvedValue(null),
      saveBrief,
    };

    const result = await new GenerateMarketBriefService(analyzer, repository, config()).execute(
      now,
    );

    expect(result.status).toBe('CREATED');
    expect(saveBrief).toHaveBeenCalledWith(
      expect.objectContaining({
        confidence: 0.45,
        evidenceIds: ['news-1'],
        expiresAt: new Date('2026-07-19T11:00:00Z'),
      }),
    );
  });

  it('does not spend model tokens when no newly fetched article exists', async () => {
    const analyze = vi.fn();
    const repository: NewsRepositoryPort = {
      saveArticles: vi.fn(),
      findArticles: vi.fn(),
      findAnalysisCandidates: vi.fn().mockResolvedValue([article]),
      findLatestBrief: vi.fn().mockResolvedValue({
        generatedAt: new Date('2026-07-19T09:10:00Z'),
      }),
      saveBrief: vi.fn(),
    };

    const result = await new GenerateMarketBriefService({ analyze }, repository, config()).execute(
      now,
    );

    expect(result.status).toBe('SKIPPED_NO_CHANGES');
    expect(analyze).not.toHaveBeenCalled();
  });
});

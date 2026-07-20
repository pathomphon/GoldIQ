import { describe, expect, it, vi } from 'vitest';

import type { NewsProviderPort } from '../domain/news-provider.port';
import type { NewsRepositoryPort } from '../domain/news-repository.port';
import { RefreshNewsService } from './refresh-news.service';

describe('RefreshNewsService', () => {
  it('persists normalized articles and reports partial source failures', async () => {
    const article = {
      source: 'FEDERALRESERVE.GOV',
      externalId: 'fed-1',
      canonicalUrl: 'https://www.federalreserve.gov/news/fed-1',
      title: 'Policy update',
      excerpt: null,
      sourceTier: 'PRIMARY' as const,
      publishedAt: new Date('2026-07-19T09:00:00Z'),
      fetchedAt: new Date('2026-07-19T10:00:00Z'),
      rawHash: 'a'.repeat(64),
      urlHash: 'b'.repeat(64),
    };
    const provider: NewsProviderPort = {
      fetchLatest: vi.fn().mockResolvedValue({
        articles: [article],
        sourcesAttempted: 2,
        sourcesSucceeded: 1,
        errors: ['TREASURY.GOV: timeout'],
      }),
    };
    const saveArticles = vi.fn().mockResolvedValue(0);
    const repository: NewsRepositoryPort = {
      saveArticles,
      findArticles: vi.fn(),
      findArticleById: vi.fn(),
      findAnalysisCandidates: vi.fn(),
      saveArticleAnalysis: vi.fn(),
      findLatestBrief: vi.fn(),
      saveBrief: vi.fn(),
    };

    const result = await new RefreshNewsService(provider, repository).execute();

    expect(saveArticles).toHaveBeenCalledWith([article]);
    expect(result).toEqual({
      received: 1,
      inserted: 0,
      duplicates: 1,
      sourcesAttempted: 2,
      sourcesSucceeded: 1,
      errors: ['TREASURY.GOV: timeout'],
    });
  });
});

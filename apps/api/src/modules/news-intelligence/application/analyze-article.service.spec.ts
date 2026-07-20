import { describe, expect, it, vi, beforeEach } from 'vitest';
import { NotFoundException } from '@nestjs/common';

import type { ArticleAnalyzerPort } from '../domain/article-analyzer.port';
import type { ArticleAnalysis } from '../domain/article-analysis.schema';
import type { NewsRepositoryPort } from '../domain/news-repository.port';
import type { NewsArticle } from '../domain/news.types';
import { AnalyzeArticleService } from './analyze-article.service';

describe('AnalyzeArticleService', () => {
  let service: AnalyzeArticleService;
  let mockAnalyzer: ArticleAnalyzerPort;
  let mockRepository: NewsRepositoryPort;

  const article: NewsArticle = {
    id: 'art-100',
    source: 'FEDERALRESERVE.GOV',
    canonicalUrl: 'https://federalreserve.gov/news/100',
    title: 'Fed maintains target rate range',
    excerpt: 'The Federal Reserve kept interest rates steady at 5.25%-5.50%.',
    sourceTier: 'PRIMARY',
    publishedAt: new Date('2026-07-20T10:00:00Z'),
    fetchedAt: new Date('2026-07-20T10:05:00Z'),
  };

  const sampleAnalysis: ArticleAnalysis = {
    relevant: true,
    category: 'FED',
    summaryTh: 'เฟดคงอัตราดอกเบี้ยนโยบาย',
    facts: [{ claim: 'เฟดคงอัตราดอกเบี้ยที่ 5.25%-5.50%', value: '5.25%-5.50%' }],
    goldImpact: 'NEUTRAL',
    thaiGoldImpact: 'NEUTRAL',
    impactScore: 0,
    horizon: 'SHORT_TERM',
    confidence: 0.8,
    reasons: ['การคงดอกเบี้ยตรงตามที่ตลาดคาดการณ์ไว้'],
    riskFlags: [],
  };

  beforeEach(() => {
    mockAnalyzer = {
      analyzeArticle: vi.fn().mockResolvedValue(sampleAnalysis),
    };

    mockRepository = {
      saveArticles: vi.fn(),
      findArticles: vi.fn(),
      findArticleById: vi.fn().mockResolvedValue(article),
      findAnalysisCandidates: vi.fn(),
      saveArticleAnalysis: vi.fn((id: string, analysis: ArticleAnalysis): Promise<NewsArticle> =>
        Promise.resolve({
          ...article,
          id,
          analysis,
        }),
      ),
      saveBrief: vi.fn(),
      findLatestBrief: vi.fn(),
    };

    service = new AnalyzeArticleService(mockAnalyzer, mockRepository);
  });

  it('analyzes article and persists analysis result', async () => {
    const findArticleByIdSpy = vi.spyOn(mockRepository, 'findArticleById');
    const analyzeArticleSpy = vi.spyOn(mockAnalyzer, 'analyzeArticle');
    const saveArticleAnalysisSpy = vi.spyOn(mockRepository, 'saveArticleAnalysis');

    const result = await service.execute('art-100');

    expect(findArticleByIdSpy).toHaveBeenCalledWith('art-100');
    expect(analyzeArticleSpy).toHaveBeenCalledWith(article);
    expect(saveArticleAnalysisSpy).toHaveBeenCalledWith('art-100', sampleAnalysis);
    expect(result.analysis?.category).toBe('FED');
    expect(result.analysis?.goldImpact).toBe('NEUTRAL');
  });

  it('throws NotFoundException when article is missing', async () => {
    const findArticleByIdSpy = vi
      .spyOn(mockRepository, 'findArticleById')
      .mockResolvedValueOnce(null);

    await expect(service.execute('unknown-id')).rejects.toThrow(NotFoundException);
    expect(findArticleByIdSpy).toHaveBeenCalledWith('unknown-id');
  });
});

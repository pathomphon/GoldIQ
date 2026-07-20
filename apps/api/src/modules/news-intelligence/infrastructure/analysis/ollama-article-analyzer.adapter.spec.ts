import { describe, expect, it, vi, beforeEach } from 'vitest';
import type { ConfigService } from '@nestjs/config';

import type { AppEnvironment } from '../../../../config/environment.schema';
import type { NewsArticle } from '../../domain/news.types';
import { OllamaArticleAnalyzerAdapter } from './ollama-article-analyzer.adapter';

describe('OllamaArticleAnalyzerAdapter', () => {
  let adapter: OllamaArticleAnalyzerAdapter;
  let mockConfig: ConfigService<AppEnvironment, true>;

  const article: NewsArticle = {
    id: 'art-1',
    source: 'FEDERALRESERVE.GOV',
    canonicalUrl: 'https://federalreserve.gov/news/1',
    title: 'Fed signals rate cuts ahead as inflation cools',
    excerpt: 'CPI inflation slowed to 2.4% annually, boosting rate cut expectations.',
    sourceTier: 'PRIMARY',
    publishedAt: new Date('2026-07-20T10:00:00Z'),
    fetchedAt: new Date('2026-07-20T10:05:00Z'),
  };

  beforeEach(() => {
    mockConfig = {
      get: vi.fn((key: string) => {
        if (key === 'researchAgent.ollamaBaseUrl') return 'http://localhost:11434';
        if (key === 'researchAgent.model') return 'qwen2.5-coder:latest';
        if (key === 'researchAgent.timeoutMs') return 10_000;
        return null;
      }),
    } as unknown as ConfigService<AppEnvironment, true>;

    adapter = new OllamaArticleAnalyzerAdapter(mockConfig);
  });

  it('analyzes article and returns parsed ArticleAnalysis', async () => {
    const mockAnalysisPayload = {
      relevant: true,
      category: 'FED',
      summaryTh: 'เฟดส่งสัญญาณลดดอกเบี้ยหลังเงินเฟ้อชะลอตัว',
      facts: [{ claim: 'เงินเฟ้อ CPI ชะลอตัวลงเหลือ 2.4%', value: '2.4%' }],
      goldImpact: 'BULLISH',
      thaiGoldImpact: 'BULLISH',
      impactScore: 65,
      horizon: 'SHORT_TERM',
      confidence: 0.85,
      reasons: ['การคาดการณ์ดอกเบี้ยลดลงหนุนราคาทองคำ'],
      riskFlags: [],
    };

    vi.spyOn(globalThis, 'fetch').mockImplementation(() =>
      Promise.resolve(
        new Response(
          JSON.stringify({
            model: 'qwen2.5-coder:latest',
            message: { content: JSON.stringify(mockAnalysisPayload) },
          }),
          { status: 200, headers: { 'content-type': 'application/json' } },
        ),
      ),
    );

    const result = await adapter.analyzeArticle(article);

    expect(result.relevant).toBe(true);
    expect(result.category).toBe('FED');
    expect(result.goldImpact).toBe('BULLISH');
    expect(result.impactScore).toBe(65);
    expect(result.facts).toHaveLength(1);
    expect(result.facts[0]?.claim).toBe('เงินเฟ้อ CPI ชะลอตัวลงเหลือ 2.4%');
  });

  it('throws error when Ollama request fails', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(() =>
      Promise.resolve(new Response('Server error', { status: 500 })),
    );

    await expect(adapter.analyzeArticle(article)).rejects.toThrow(
      'Ollama single article analysis failed (500)',
    );
  });
});

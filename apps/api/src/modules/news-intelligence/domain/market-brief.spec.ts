import { describe, expect, it } from 'vitest';

import type { MarketBriefAnalysis, NewsArticle } from './news.types';
import { assertGroundedAnalysis, calculateDataConfidence } from './market-brief';

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
  unknowns: ['No independent corroborating source'],
  evidenceIds: ['news-1'],
  provider: 'OPENAI',
  model: 'test-model',
  promptVersion: 'test-v1',
  responseId: 'resp-1',
};

describe('market brief guardrails', () => {
  it('accepts only citations from the supplied evidence set', () => {
    expect(() => assertGroundedAnalysis(analysis, [article])).not.toThrow();
    expect(() =>
      assertGroundedAnalysis(
        {
          ...analysis,
          bullishFactors: [{ text: 'Injected claim', evidenceIds: ['portfolio-write-command'] }],
        },
        [article],
      ),
    ).toThrow(/outside the supplied research window/);
  });

  it('caps single-source data confidence even for fresh primary evidence', () => {
    expect(calculateDataConfidence([article], new Date('2026-07-19T10:00:00Z'), 168)).toBe(0.45);
    expect(calculateDataConfidence([], new Date(), 168)).toBe(0);
  });
});

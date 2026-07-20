import { describe, expect, it } from 'vitest';

import type { NewsArticle } from './news.types';
import { goldNewsRelevanceScore, rankGoldResearchCandidates } from './gold-news-relevance';

function article(id: string, title: string, publishedAt = '2026-07-19T09:00:00Z'): NewsArticle {
  return {
    id,
    source: 'PRIMARY.EXAMPLE',
    canonicalUrl: `https://primary.example/${id}`,
    title,
    excerpt: null,
    sourceTier: 'PRIMARY',
    publishedAt: new Date(publishedAt),
    fetchedAt: new Date(publishedAt),
  };
}

describe('gold news relevance', () => {
  it('prioritizes direct gold and Thai-baht evidence over general macro evidence', () => {
    const ranked = rankGoldResearchCandidates(
      [
        article('regulation', 'Agencies update bank examination procedures'),
        article('inflation', 'Consumer Price Index inflation report'),
        article('thai-gold', 'Gold market reacts to Thai baht exchange rate'),
      ],
      10,
    );

    expect(ranked.map((candidate) => candidate.id)).toEqual(['thai-gold', 'inflation']);
  });

  it('filters unrelated releases and recognizes monetary-policy drivers', () => {
    expect(goldNewsRelevanceScore(article('unrelated', 'Appointment of a committee member'))).toBe(
      0,
    );
    expect(
      goldNewsRelevanceScore(article('rates', 'Federal Reserve interest rate decision')),
    ).toBeGreaterThanOrEqual(3);
  });

  it('recognizes Thai gold analysis and baht drivers', () => {
    expect(
      goldNewsRelevanceScore(
        article('thai-analysis', 'บทวิเคราะห์ราคาทองคำ: จับตาค่าเงินบาทและดอกเบี้ยเฟด'),
      ),
    ).toBeGreaterThanOrEqual(18);
  });

  it('keeps only the latest FINNOMENA price snapshot per reference type', () => {
    const latest = {
      ...article('latest', 'ราคาอ้างอิงทองคำไทยล่าสุดจาก FINNOMENA', '2026-07-19T09:00:00Z'),
      source: 'FINNOMENA.COM',
      canonicalUrl: 'https://www.finnomena.com/gold?reference=thai-gold&asOf=20260719_2',
      sourceTier: 'SECONDARY' as const,
    };
    const previous = {
      ...article('previous', 'ราคาอ้างอิงทองคำไทยล่าสุดจาก FINNOMENA', '2026-07-19T08:00:00Z'),
      source: 'FINNOMENA.COM',
      canonicalUrl: 'https://www.finnomena.com/gold?reference=thai-gold&asOf=20260719_1',
      sourceTier: 'SECONDARY' as const,
    };

    expect(rankGoldResearchCandidates([previous, latest], 10).map(({ id }) => id)).toEqual([
      'latest',
    ]);
  });
});

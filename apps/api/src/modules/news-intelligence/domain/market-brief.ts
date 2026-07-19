import type { MarketBriefAnalysis, MarketBriefFactor, NewsArticle } from './news.types';

function factorEvidence(factors: readonly MarketBriefFactor[]): readonly string[] {
  return factors.flatMap((factor) => factor.evidenceIds);
}

export function assertGroundedAnalysis(
  analysis: MarketBriefAnalysis,
  articles: readonly NewsArticle[],
): void {
  const availableIds = new Set(articles.map((article) => article.id));
  const citedIds = [
    ...analysis.evidenceIds,
    ...factorEvidence(analysis.bullishFactors),
    ...factorEvidence(analysis.bearishFactors),
  ];

  if (analysis.evidenceIds.length === 0) {
    throw new Error('Market brief must cite at least one evidence item');
  }
  if (citedIds.some((id) => !availableIds.has(id))) {
    throw new Error('Market brief cited evidence outside the supplied research window');
  }
  if (
    [...analysis.bullishFactors, ...analysis.bearishFactors].some(
      (factor) => factor.evidenceIds.length === 0,
    )
  ) {
    throw new Error('Every market factor must include evidence');
  }
}

export function calculateDataConfidence(
  articles: readonly NewsArticle[],
  now: Date,
  windowHours: number,
): number {
  if (articles.length === 0) return 0;

  const freshness =
    articles.reduce((sum, article) => {
      const ageHours = Math.max(0, now.getTime() - article.publishedAt.getTime()) / 3_600_000;
      return sum + Math.max(0, 1 - ageHours / windowHours);
    }, 0) / articles.length;
  const independentSources = new Set(articles.map((article) => article.source)).size;
  const sourceQuality = articles.every((article) => article.sourceTier === 'PRIMARY') ? 1 : 0.7;
  const corroboration = Math.min(1, independentSources / 2);
  const completeness = Math.min(1, articles.length / 10);
  let confidence =
    sourceQuality * 0.35 + freshness * 0.3 + corroboration * 0.2 + completeness * 0.15;

  if (independentSources === 1) confidence = Math.min(confidence, 0.45);
  return Math.round(Math.min(0.85, confidence) * 1_000) / 1_000;
}

export type NewsSourceTier = 'PRIMARY';

export interface NormalizedNewsArticle {
  readonly source: string;
  readonly externalId: string;
  readonly canonicalUrl: string;
  readonly title: string;
  readonly excerpt: string | null;
  readonly sourceTier: NewsSourceTier;
  readonly publishedAt: Date;
  readonly fetchedAt: Date;
  readonly rawHash: string;
  readonly urlHash: string;
}

export interface NewsArticle {
  readonly id: string;
  readonly source: string;
  readonly canonicalUrl: string;
  readonly title: string;
  readonly excerpt: string | null;
  readonly sourceTier: NewsSourceTier;
  readonly publishedAt: Date;
  readonly fetchedAt: Date;
}

export type MarketBriefStance = 'BULLISH' | 'NEUTRAL' | 'BEARISH';

export interface MarketBriefFactor {
  readonly text: string;
  readonly evidenceIds: readonly string[];
}

export interface MarketBriefAnalysis {
  readonly stance: MarketBriefStance;
  readonly summary: string;
  readonly bullishFactors: readonly MarketBriefFactor[];
  readonly bearishFactors: readonly MarketBriefFactor[];
  readonly riskFlags: readonly string[];
  readonly unknowns: readonly string[];
  readonly evidenceIds: readonly string[];
  readonly provider: string;
  readonly model: string;
  readonly promptVersion: string;
  readonly responseId: string | null;
}

export interface MarketBrief extends MarketBriefAnalysis {
  readonly id: string;
  readonly generatedAt: Date;
  readonly windowStart: Date;
  readonly windowEnd: Date;
  readonly confidence: number;
  readonly expiresAt: Date;
  readonly isStale: boolean;
  readonly evidence: readonly NewsArticle[];
}

export interface FetchNewsResult {
  readonly articles: readonly NormalizedNewsArticle[];
  readonly sourcesAttempted: number;
  readonly sourcesSucceeded: number;
  readonly errors: readonly string[];
}

export interface SaveNewsResult {
  readonly received: number;
  readonly inserted: number;
  readonly duplicates: number;
  readonly sourcesAttempted: number;
  readonly sourcesSucceeded: number;
  readonly errors: readonly string[];
}

export interface FindNewsQuery {
  readonly limit: number;
  readonly source?: string;
}

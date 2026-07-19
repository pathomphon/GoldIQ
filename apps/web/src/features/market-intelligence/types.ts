export type MarketBriefStance = 'BULLISH' | 'NEUTRAL' | 'BEARISH';

export interface MarketBriefFactor {
  readonly text: string;
  readonly evidenceIds: readonly string[];
}

export interface MarketBriefEvidence {
  readonly id: string;
  readonly source: string;
  readonly canonicalUrl: string;
  readonly title: string;
  readonly publishedAt: string;
}

export interface MarketBrief {
  readonly id: string;
  readonly generatedAt: string;
  readonly stance: MarketBriefStance;
  readonly confidence: number;
  readonly summary: string;
  readonly bullishFactors: readonly MarketBriefFactor[];
  readonly bearishFactors: readonly MarketBriefFactor[];
  readonly riskFlags: readonly string[];
  readonly unknowns: readonly string[];
  readonly expiresAt: string;
  readonly isStale: boolean;
  readonly evidence: readonly MarketBriefEvidence[];
}

export interface MarketBriefResult {
  readonly data: MarketBrief | null;
  readonly error: string | null;
}

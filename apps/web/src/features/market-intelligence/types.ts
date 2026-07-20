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

export interface NewsAgentStatus {
  readonly newsScheduler: {
    readonly enabled: boolean;
    readonly cron: string;
    readonly lockTtlMs: number;
  };
  readonly researchAgentScheduler: {
    readonly enabled: boolean;
    readonly cron: string;
    readonly lockTtlMs: number;
  };
  readonly provider: {
    readonly activeProvider: 'openai' | 'ollama';
    readonly model: string;
    readonly ollamaBaseUrl: string;
    readonly ollamaStatus: 'UP' | 'DOWN';
    readonly ollamaLatencyMs: number | null;
    readonly ollamaVersion: string | null;
    readonly ollamaMessage?: string;
    readonly openAiConfigured: boolean;
  };
  readonly latestBrief: {
    readonly status: 'AVAILABLE' | 'UNAVAILABLE';
    readonly id?: string;
    readonly generatedAt?: string;
    readonly expiresAt?: string;
    readonly stance?: MarketBriefStance;
    readonly confidence?: number;
    readonly isStale?: boolean;
  };
}

export interface NewsAgentStatusResult {
  readonly data: NewsAgentStatus | null;
  readonly error: string | null;
}

export type NewsCategory =
  | 'FED'
  | 'INTEREST_RATE'
  | 'INFLATION'
  | 'USD'
  | 'BOND_YIELD'
  | 'GEOPOLITICS'
  | 'CENTRAL_BANK'
  | 'GOLD_DEMAND'
  | 'EMPLOYMENT'
  | 'GDP'
  | 'THB'
  | 'OTHER';

export type ImpactStance = 'BULLISH' | 'BEARISH' | 'NEUTRAL';
export type TimeHorizon = 'INTRADAY' | 'SHORT_TERM' | 'MEDIUM_TERM';

export interface ArticleFact {
  readonly claim: string;
  readonly value?: string;
}

export interface ArticleAnalysis {
  readonly relevant: boolean;
  readonly category: NewsCategory;
  readonly summaryTh: string;
  readonly facts: readonly ArticleFact[];
  readonly goldImpact: ImpactStance;
  readonly thaiGoldImpact: ImpactStance;
  readonly impactScore: number;
  readonly horizon: TimeHorizon;
  readonly confidence: number;
  readonly reasons: readonly string[];
  readonly riskFlags: readonly string[];
}

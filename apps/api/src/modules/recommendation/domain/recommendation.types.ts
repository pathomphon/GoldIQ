export const RISK_PROFILES = ['CONSERVATIVE', 'BALANCED', 'AGGRESSIVE'] as const;
export type RiskProfile = (typeof RISK_PROFILES)[number];

export const RECOMMENDATION_ACTIONS = [
  'BUY',
  'WAIT',
  'HOLD',
  'REVIEW_PROFIT',
  'SELL_PARTIAL',
] as const;
export type RecommendationAction = (typeof RECOMMENDATION_ACTIONS)[number];

export interface MarketBriefSignal {
  readonly id: string;
  readonly generatedAt: Date;
  readonly stance: 'BULLISH' | 'NEUTRAL' | 'BEARISH';
  readonly confidence: number;
  readonly isStale: boolean;
}

export interface RecommendationMarketIntelligence {
  readonly mode: 'SHADOW';
  readonly enabled: boolean;
  readonly status: 'DISABLED' | 'UNAVAILABLE' | 'STALE' | 'LOW_CONFIDENCE' | 'ACTIVE';
  readonly effect: 'NO_CHANGE' | 'SUPPORTS' | 'CAUTION';
  readonly baseAction: RecommendationAction;
  readonly shadowAction: RecommendationAction;
  readonly reasons: readonly string[];
  readonly brief: MarketBriefSignal | null;
}

export interface RiskSettings {
  readonly riskProfile: RiskProfile;
  readonly availableCash: number;
  readonly minimumCashReserve: number;
  readonly maxAllocationPercent: number;
  readonly profitTargetPercent: number;
  readonly sellPartialPercent: number;
  readonly stopBuyAbovePrice: number | null;
}

export interface RecommendationContext {
  readonly observedAt: Date | null;
  readonly currentBuyPrice: number | null;
  readonly currentSellPrice: number | null;
  readonly totalInvested: number;
  readonly totalGoldWeight: number;
  readonly averageCost: number;
  readonly currentValue: number;
  readonly profitLossPercentage: number;
  readonly nextBuyLevel: {
    readonly targetPrice: number;
    readonly investmentAmount: number;
    readonly sequence: number;
    readonly planName: string;
  } | null;
}

export interface Recommendation {
  readonly action: RecommendationAction;
  readonly reasons: readonly string[];
  readonly recommendedAmount: number;
  readonly sellPartialPercent: number | null;
  readonly allocation: {
    readonly availableCash: number;
    readonly reservedCash: number;
    readonly deployableCash: number;
  };
  readonly market: RecommendationContext;
  readonly settings: RiskSettings;
  readonly marketIntelligence?: RecommendationMarketIntelligence;
}

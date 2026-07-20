export type RiskProfile = 'CONSERVATIVE' | 'BALANCED' | 'AGGRESSIVE';
export type RecommendationAction =
  | 'STRONG_BUY'
  | 'BUY'
  | 'WAIT'
  | 'HOLD'
  | 'SELL'
  | 'STRONG_SELL'
  | 'REVIEW_PROFIT'
  | 'SELL_PARTIAL';
export type ShadowStatus = 'DISABLED' | 'UNAVAILABLE' | 'STALE' | 'LOW_CONFIDENCE' | 'ACTIVE';

export interface TechnicalEvidence {
  readonly summary: string;
  readonly rsiSignal?: string;
  readonly emaSignal?: string;
  readonly bollingerSignal?: string;
}

export interface PortfolioEvidence {
  readonly summary: string;
  readonly drawdownPercent: number;
  readonly positionSizePercent: number;
  readonly averageCostVsPricePercent: number;
}

export interface NewsEvidence {
  readonly summary: string;
  readonly stance: 'BULLISH' | 'NEUTRAL' | 'BEARISH' | 'UNKNOWN';
  readonly confidence: number;
}

export interface ExplainableEvidence {
  readonly technical: TechnicalEvidence;
  readonly portfolio: PortfolioEvidence;
  readonly news: NewsEvidence;
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

export interface Recommendation {
  readonly action: RecommendationAction;
  readonly why?: string;
  readonly confidence?: number;
  readonly risk?: string;
  readonly evidence?: ExplainableEvidence;
  readonly reasons: readonly string[];
  readonly recommendedAmount: number;
  readonly sellPartialPercent: number | null;
  readonly allocation: {
    readonly availableCash: number;
    readonly reservedCash: number;
    readonly deployableCash: number;
  };
  readonly market: {
    readonly observedAt: string | null;
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
  };
  readonly settings: RiskSettings;
  readonly marketIntelligence?: {
    readonly mode: 'SHADOW' | 'LIVE';
    readonly enabled: boolean;
    readonly status: ShadowStatus;
    readonly effect: 'NO_CHANGE' | 'SUPPORTS' | 'CAUTION' | 'LIVE_OVERRIDE_WAIT';
    readonly baseAction: RecommendationAction;
    readonly shadowAction: RecommendationAction;
    readonly liveAction: RecommendationAction;
    readonly reasons: readonly string[];
    readonly brief: {
      readonly id: string;
      readonly generatedAt: string;
      readonly stance: 'BULLISH' | 'NEUTRAL' | 'BEARISH';
      readonly confidence: number;
      readonly isStale: boolean;
    } | null;
  };
}

export interface RecommendationResult {
  readonly data: Recommendation | null;
  readonly error: string | null;
}

export type RiskProfile = 'CONSERVATIVE' | 'BALANCED' | 'AGGRESSIVE';
export type RecommendationAction = 'BUY' | 'WAIT' | 'HOLD' | 'REVIEW_PROFIT' | 'SELL_PARTIAL';

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
}

export interface RecommendationResult {
  readonly data: Recommendation | null;
  readonly error: string | null;
}

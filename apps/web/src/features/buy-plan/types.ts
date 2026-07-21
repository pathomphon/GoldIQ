import type { TechnicalAnalysis } from '@/features/analysis/types';
import type { GoldPriceSnapshot, GoldProductCode } from '@/features/gold-price/types';
import type { Recommendation } from '@/features/recommendation/types';

export type BuyPlanLevelStatus = 'WAITING' | 'TRIGGERED' | 'EXECUTED' | 'CANCELLED';

export interface BuyPlanLevel {
  readonly id: string;
  readonly targetPrice: number;
  readonly investmentAmount: number;
  readonly sequence: number;
  readonly status: BuyPlanLevelStatus;
  readonly triggeredAt: string | null;
  readonly executedAt: string | null;
}

export interface BuyPlan {
  readonly id: string;
  readonly name: string;
  readonly productCode: GoldProductCode;
  readonly productName: string;
  readonly isActive: boolean;
  readonly levels: readonly BuyPlanLevel[];
  readonly createdAt: string;
}

export interface AlertEvent {
  readonly id: string;
  readonly planName: string;
  readonly levelSequence: number;
  readonly observedPrice: number;
  readonly message: string;
  readonly deliveryStatus: 'PENDING' | 'SENT' | 'SKIPPED' | 'FAILED';
  readonly triggeredAt: string;
}

export interface BuyPlanDashboardData {
  readonly plans: readonly BuyPlan[];
  readonly recentAlerts: readonly AlertEvent[];
}

export interface BuyPriceSuggestion {
  readonly sequence: number;
  readonly targetPrice: number;
  readonly discountAmount: number;
  readonly discountPercent: number;
  readonly investmentAmount: number;
  readonly rationale: string;
}

export interface SellPriceSuggestion {
  readonly sequence: number;
  readonly targetPrice: number;
  readonly profitAmount: number;
  readonly profitPercent: number;
  readonly rationale: string;
}

export interface PriceSuggestionsForProduct {
  readonly productCode: GoldProductCode;
  readonly productName: string;
  readonly currentBuyPrice: number;
  readonly currentSellPrice: number;
  readonly buySuggestions: readonly BuyPriceSuggestion[];
  readonly sellSuggestions: readonly SellPriceSuggestion[];
}

export interface BuyPlanDashboardResult {
  readonly dashboard: BuyPlanDashboardData;
  readonly currentPrices?: readonly GoldPriceSnapshot[];
  readonly recommendation?: Recommendation | null;
  readonly analysis?: TechnicalAnalysis | null;
  readonly error: string | null;
}


import type { GoldProductCode } from '@/features/gold-price/types';

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

export interface BuyPlanDashboardResult {
  readonly dashboard: BuyPlanDashboardData;
  readonly error: string | null;
}

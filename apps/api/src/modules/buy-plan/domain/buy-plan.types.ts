import type { GoldProductCode } from '../../gold-price/domain/gold-product';

export type BuyPlanLevelStatus = 'WAITING' | 'TRIGGERED' | 'EXECUTED' | 'CANCELLED';
export type AlertDeliveryStatus = 'PENDING' | 'SENT' | 'SKIPPED' | 'FAILED';

export interface BuyPlanLevel {
  readonly id: string;
  readonly targetPrice: number;
  readonly investmentAmount: number;
  readonly sequence: number;
  readonly status: BuyPlanLevelStatus;
  readonly triggeredAt: Date | null;
  readonly executedAt: Date | null;
}

export interface BuyPlan {
  readonly id: string;
  readonly name: string;
  readonly productCode: GoldProductCode;
  readonly productName: string;
  readonly isActive: boolean;
  readonly levels: readonly BuyPlanLevel[];
  readonly createdAt: Date;
}

export interface AlertEvent {
  readonly id: string;
  readonly planName: string;
  readonly levelSequence: number;
  readonly observedPrice: number;
  readonly message: string;
  readonly deliveryStatus: AlertDeliveryStatus;
  readonly triggeredAt: Date;
}

export interface BuyPlanDashboard {
  readonly plans: readonly BuyPlan[];
  readonly recentAlerts: readonly AlertEvent[];
}

export interface CreateBuyPlanInput {
  readonly name: string;
  readonly productCode: GoldProductCode;
  readonly levels: readonly {
    readonly targetPrice: number;
    readonly investmentAmount: number;
    readonly sequence: number;
  }[];
}

export interface WaitingBuyLevel {
  readonly id: string;
  readonly planName: string;
  readonly productCode: GoldProductCode;
  readonly sequence: number;
  readonly targetPrice: number;
  readonly investmentAmount: number;
}

export interface CurrentSellPrice {
  readonly productCode: GoldProductCode;
  readonly sellPrice: number;
}

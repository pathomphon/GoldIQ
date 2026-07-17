import type {
  AlertDeliveryStatus,
  AlertEvent,
  BuyPlan,
  BuyPlanLevelStatus,
  CreateBuyPlanInput,
  CurrentSellPrice,
  WaitingBuyLevel,
} from './buy-plan.types';

export const BUY_PLAN_REPOSITORY = Symbol('BUY_PLAN_REPOSITORY');

export interface BuyPlanRepositoryPort {
  findPlans(): Promise<readonly BuyPlan[]>;
  findRecentAlerts(limit: number): Promise<readonly AlertEvent[]>;
  createPlan(input: CreateBuyPlanInput): Promise<BuyPlan>;
  deletePlan(id: string): Promise<boolean>;
  updateLevelStatus(id: string, status: BuyPlanLevelStatus): Promise<boolean>;
  findWaitingLevels(): Promise<readonly WaitingBuyLevel[]>;
  findCurrentSellPrices(): Promise<readonly CurrentSellPrice[]>;
  triggerLevel(
    level: WaitingBuyLevel,
    observedPrice: number,
    message: string,
  ): Promise<string | null>;
  updateAlertDelivery(
    eventId: string,
    status: AlertDeliveryStatus,
    error: string | null,
  ): Promise<void>;
}

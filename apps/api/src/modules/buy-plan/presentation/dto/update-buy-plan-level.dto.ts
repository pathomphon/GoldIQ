import { IsIn } from 'class-validator';

import type { BuyPlanLevelStatus } from '../../domain/buy-plan.types';

const statuses: readonly BuyPlanLevelStatus[] = ['WAITING', 'TRIGGERED', 'EXECUTED', 'CANCELLED'];

export class UpdateBuyPlanLevelDto {
  @IsIn(statuses)
  status!: BuyPlanLevelStatus;
}

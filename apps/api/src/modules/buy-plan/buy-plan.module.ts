import { Module } from '@nestjs/common';

import { BuyPlanAlertScheduler } from './application/buy-plan-alert.scheduler';
import { BuyPlanService } from './application/buy-plan.service';
import { BUY_PLAN_REPOSITORY } from './domain/buy-plan.repository.port';
import { ALERT_NOTIFICATION_PORT } from './domain/alert-notification.port';
import { MessagingAlertNotificationAdapter } from './infrastructure/notification/messaging-alert-notification.adapter';
import { PrismaBuyPlanRepository } from './infrastructure/persistence/prisma-buy-plan.repository';
import { BuyPlanController } from './presentation/buy-plan.controller';

@Module({
  controllers: [BuyPlanController],
  providers: [
    BuyPlanService,
    BuyPlanAlertScheduler,
    PrismaBuyPlanRepository,
    MessagingAlertNotificationAdapter,
    { provide: BUY_PLAN_REPOSITORY, useExisting: PrismaBuyPlanRepository },
    { provide: ALERT_NOTIFICATION_PORT, useExisting: MessagingAlertNotificationAdapter },
  ],
})
export class BuyPlanModule {}

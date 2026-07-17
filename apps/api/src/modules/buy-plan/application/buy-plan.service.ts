import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';

import {
  BUY_PLAN_REPOSITORY,
  type BuyPlanRepositoryPort,
} from '../domain/buy-plan.repository.port';
import {
  ALERT_NOTIFICATION_PORT,
  type AlertNotificationPort,
} from '../domain/alert-notification.port';
import { findTriggeredLevels } from '../domain/buy-plan.evaluator';
import type {
  BuyPlan,
  BuyPlanDashboard,
  BuyPlanLevelStatus,
  CreateBuyPlanInput,
} from '../domain/buy-plan.types';

@Injectable()
export class BuyPlanService {
  constructor(
    @Inject(BUY_PLAN_REPOSITORY)
    private readonly repository: BuyPlanRepositoryPort,
    @Inject(ALERT_NOTIFICATION_PORT)
    private readonly notifications: AlertNotificationPort,
  ) {}

  async dashboard(): Promise<BuyPlanDashboard> {
    const [plans, recentAlerts] = await Promise.all([
      this.repository.findPlans(),
      this.repository.findRecentAlerts(20),
    ]);
    return { plans, recentAlerts };
  }

  create(input: CreateBuyPlanInput): Promise<BuyPlan> {
    const sequences = new Set(input.levels.map((level) => level.sequence));
    if (input.levels.length === 0 || sequences.size !== input.levels.length) {
      throw new BadRequestException('A buy plan requires levels with unique sequences');
    }
    return this.repository.createPlan(input);
  }

  async delete(id: string): Promise<void> {
    if (!(await this.repository.deletePlan(id))) {
      throw new NotFoundException('Buy plan not found');
    }
  }

  async updateLevelStatus(id: string, status: BuyPlanLevelStatus): Promise<void> {
    if (!(await this.repository.updateLevelStatus(id, status))) {
      throw new NotFoundException('Buy plan level not found');
    }
  }

  async evaluateAlerts(): Promise<number> {
    const [levels, prices] = await Promise.all([
      this.repository.findWaitingLevels(),
      this.repository.findCurrentSellPrices(),
    ]);
    const candidates = findTriggeredLevels(levels, prices);
    const results = await Promise.all(
      candidates.map(async (candidate) => {
        const eventId = await this.repository.triggerLevel(
          candidate.level,
          candidate.observedPrice,
          candidate.message,
        );
        if (!eventId) return false;
        const delivery = await this.notifications.send(candidate.message);
        await this.repository.updateAlertDelivery(eventId, delivery.status, delivery.error);
        return true;
      }),
    );
    return results.filter(Boolean).length;
  }
}

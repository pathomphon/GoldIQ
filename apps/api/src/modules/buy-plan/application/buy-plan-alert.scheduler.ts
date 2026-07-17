import { Inject, Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';

import type { AppEnvironment } from '../../../config/environment.schema';
import {
  DISTRIBUTED_LOCK_PORT,
  type DistributedLockPort,
} from '../../../shared/domain/distributed-lock.port';
import { BuyPlanService } from './buy-plan.service';

const ALERT_LOCK_KEY = 'goldiq:locks:buy-plan-alerts';

@Injectable()
export class BuyPlanAlertScheduler {
  private readonly logger = new Logger(BuyPlanAlertScheduler.name);
  private readonly enabled: boolean;
  private readonly lockTtlMs: number;

  constructor(
    @Inject(BuyPlanService) private readonly buyPlans: BuyPlanService,
    @Inject(DISTRIBUTED_LOCK_PORT) private readonly lock: DistributedLockPort,
    config: ConfigService<AppEnvironment, true>,
  ) {
    this.enabled = config.get('buyPlanAlerts.enabled', { infer: true });
    this.lockTtlMs = config.get('buyPlanAlerts.lockTtlMs', { infer: true });
  }

  @Cron(process.env.BUY_PLAN_ALERT_CRON ?? '*/30 * * * * *', {
    name: 'buy-plan-alerts',
    waitForCompletion: true,
  })
  async evaluate(): Promise<void> {
    if (!this.enabled) return;
    try {
      const triggered = await this.lock.runWithLock(ALERT_LOCK_KEY, this.lockTtlMs, () =>
        this.buyPlans.evaluateAlerts(),
      );
      if (triggered) {
        this.logger.log({ triggered }, 'Buy plan alerts triggered');
      }
    } catch (error: unknown) {
      this.logger.error(
        { err: error instanceof Error ? error.message : 'Unknown alert error' },
        'Buy plan alert evaluation failed',
      );
    }
  }
}

import { Inject, Injectable, Logger, type OnApplicationBootstrap } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron } from '@nestjs/schedule';

import type { AppEnvironment } from '../../../config/environment.schema';
import {
  DISTRIBUTED_LOCK_PORT,
  type DistributedLockPort,
} from '../../../shared/domain/distributed-lock.port';
import { RefreshGoldPricesService } from './refresh-gold-prices.service';

const REFRESH_LOCK_KEY = 'goldiq:locks:gold-price-refresh';

@Injectable()
export class GoldPriceRefreshScheduler implements OnApplicationBootstrap {
  private readonly logger = new Logger(GoldPriceRefreshScheduler.name);
  private readonly enabled: boolean;
  private readonly lockTtlMs: number;

  constructor(
    @Inject(RefreshGoldPricesService)
    private readonly refreshGoldPrices: RefreshGoldPricesService,
    @Inject(DISTRIBUTED_LOCK_PORT)
    private readonly distributedLock: DistributedLockPort,
    config: ConfigService<AppEnvironment, true>,
  ) {
    this.enabled = config.get('hsh.schedulerEnabled', { infer: true });
    this.lockTtlMs = config.get('hsh.refreshLockTtlMs', { infer: true });
  }

  onApplicationBootstrap(): void {
    if (this.enabled) {
      void this.refresh('startup');
    }
  }

  @Cron(process.env.HSH_POLL_CRON ?? '*/1 * * * *', {
    name: 'gold-price-refresh',
    waitForCompletion: true,
  })
  async scheduledRefresh(): Promise<void> {
    if (this.enabled) {
      await this.refresh('schedule');
    }
  }

  private async refresh(trigger: 'startup' | 'schedule'): Promise<void> {
    try {
      const result = await this.distributedLock.runWithLock(REFRESH_LOCK_KEY, this.lockTtlMs, () =>
        this.refreshGoldPrices.execute(),
      );

      if (!result) {
        this.logger.debug({ trigger }, 'Gold price refresh lock is held');
        return;
      }

      this.logger.log({ trigger, ...result }, 'Gold prices refreshed');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown refresh error';
      this.logger.error({ trigger, err: message }, 'Gold price refresh failed');
    }
  }
}

import { Inject, Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';

import {
  DISTRIBUTED_LOCK_PORT,
  type DistributedLockPort,
} from '../../../shared/domain/distributed-lock.port';
import {
  GOLD_PRICE_REPOSITORY_PORT,
  type GoldPriceRepositoryPort,
} from '../domain/gold-price-repository.port';

const CLEANUP_LOCK_KEY = 'goldiq:locks:gold-price-cleanup';
const CLEANUP_LOCK_TTL_MS = 60000;
const RAW_TICK_RETENTION_DAYS = 90;

@Injectable()
export class GoldPriceCleanupScheduler {
  private readonly logger = new Logger(GoldPriceCleanupScheduler.name);

  constructor(
    @Inject(GOLD_PRICE_REPOSITORY_PORT)
    private readonly repository: GoldPriceRepositoryPort,
    @Inject(DISTRIBUTED_LOCK_PORT)
    private readonly distributedLock: DistributedLockPort,
  ) {}

  @Cron(process.env.GOLD_PRICE_CLEANUP_CRON ?? '0 0 * * *', {
    name: 'gold-price-cleanup',
    waitForCompletion: true,
  })
  async scheduledCleanup(): Promise<void> {
    try {
      const result = await this.distributedLock.runWithLock(
        CLEANUP_LOCK_KEY,
        CLEANUP_LOCK_TTL_MS,
        async () => {
          const olderThan = new Date(Date.now() - RAW_TICK_RETENTION_DAYS * 24 * 60 * 60 * 1000);
          const purgedCount = await this.repository.purgeOldRawPrices(olderThan);
          return purgedCount;
        },
      );

      if (result === null) {
        this.logger.debug('Gold price cleanup lock is held by another instance');
        return;
      }

      this.logger.log({ purgedCount: result }, 'Old raw gold price ticks cleaned up');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown cleanup error';
      this.logger.error({ err: message }, 'Gold price cleanup failed');
    }
  }
}

import { Inject, Injectable, Logger, type OnApplicationBootstrap } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron } from '@nestjs/schedule';

import type { AppEnvironment } from '../../../config/environment.schema';
import {
  DISTRIBUTED_LOCK_PORT,
  type DistributedLockPort,
} from '../../../shared/domain/distributed-lock.port';
import { RefreshNewsService } from './refresh-news.service';

const NEWS_REFRESH_LOCK_KEY = 'goldiq:locks:news-refresh';

@Injectable()
export class NewsRefreshScheduler implements OnApplicationBootstrap {
  private readonly logger = new Logger(NewsRefreshScheduler.name);
  private readonly enabled: boolean;
  private readonly lockTtlMs: number;

  constructor(
    @Inject(RefreshNewsService)
    private readonly refreshNews: RefreshNewsService,
    @Inject(DISTRIBUTED_LOCK_PORT)
    private readonly lock: DistributedLockPort,
    config: ConfigService<AppEnvironment, true>,
  ) {
    this.enabled = config.get('news.enabled', { infer: true });
    this.lockTtlMs = config.get('news.refreshLockTtlMs', { infer: true });
  }

  onApplicationBootstrap(): void {
    if (this.enabled) {
      setTimeout(() => void this.refresh('startup'), 1_000);
    }
  }

  @Cron(process.env.NEWS_REFRESH_CRON ?? '0 */15 * * * *', {
    name: 'news-refresh',
    waitForCompletion: true,
  })
  async scheduledRefresh(): Promise<void> {
    if (this.enabled) await this.refresh('schedule');
  }

  private async refresh(trigger: 'startup' | 'schedule'): Promise<void> {
    try {
      const result = await this.lock.runWithLock(NEWS_REFRESH_LOCK_KEY, this.lockTtlMs, () =>
        this.refreshNews.execute(),
      );
      if (!result) {
        this.logger.debug({ trigger }, 'News refresh lock is held');
        return;
      }
      this.logger.log({ trigger, ...result }, 'News intelligence refreshed');
    } catch (error: unknown) {
      this.logger.error(
        { trigger, err: error instanceof Error ? error.message : 'Unknown news refresh error' },
        'News intelligence refresh failed',
      );
    }
  }
}

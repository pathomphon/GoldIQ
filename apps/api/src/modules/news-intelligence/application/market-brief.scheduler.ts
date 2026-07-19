import { Inject, Injectable, Logger, type OnApplicationBootstrap } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron } from '@nestjs/schedule';

import type { AppEnvironment } from '../../../config/environment.schema';
import {
  DISTRIBUTED_LOCK_PORT,
  type DistributedLockPort,
} from '../../../shared/domain/distributed-lock.port';
import { GenerateMarketBriefService } from './generate-market-brief.service';

const MARKET_BRIEF_LOCK_KEY = 'goldiq:locks:market-brief';

@Injectable()
export class MarketBriefScheduler implements OnApplicationBootstrap {
  private readonly logger = new Logger(MarketBriefScheduler.name);
  private readonly enabled: boolean;
  private readonly lockTtlMs: number;

  constructor(
    @Inject(GenerateMarketBriefService)
    private readonly generateBrief: GenerateMarketBriefService,
    @Inject(DISTRIBUTED_LOCK_PORT)
    private readonly lock: DistributedLockPort,
    config: ConfigService<AppEnvironment, true>,
  ) {
    this.enabled = config.get('researchAgent.enabled', { infer: true });
    this.lockTtlMs = config.get('researchAgent.lockTtlMs', { infer: true });
  }

  onApplicationBootstrap(): void {
    if (this.enabled) setTimeout(() => void this.generate('startup'), 2_000);
  }

  @Cron(process.env.RESEARCH_AGENT_CRON ?? '0 5 * * * *', {
    name: 'market-brief',
    waitForCompletion: true,
  })
  async scheduledGeneration(): Promise<void> {
    if (this.enabled) await this.generate('schedule');
  }

  private async generate(trigger: 'startup' | 'schedule'): Promise<void> {
    try {
      const result = await this.lock.runWithLock(MARKET_BRIEF_LOCK_KEY, this.lockTtlMs, () =>
        this.generateBrief.execute(),
      );
      if (!result) {
        this.logger.debug({ trigger }, 'Market brief lock is held');
        return;
      }
      this.logger.log({ trigger, status: result.status }, 'Market brief generation completed');
    } catch (error: unknown) {
      this.logger.error(
        {
          trigger,
          err: error instanceof Error ? error.message : 'Unknown market brief generation error',
        },
        'Market brief generation failed',
      );
    }
  }
}

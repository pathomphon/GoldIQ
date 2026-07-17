import { Inject, Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

import type { AppEnvironment } from '../../config/environment.schema';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private readonly client: Redis;

  constructor(
    @Inject(ConfigService)
    config: ConfigService<AppEnvironment, true>,
  ) {
    this.client = new Redis(config.get('redis.url', { infer: true }), {
      enableOfflineQueue: false,
      lazyConnect: true,
      maxRetriesPerRequest: 1,
      retryStrategy: (attempt) => Math.min(100 * 2 ** Math.min(attempt, 6), 5_000),
    });
    this.client.on('error', (error: Error) => {
      this.logger.warn({ err: error.message }, 'Redis connection unavailable');
    });
  }

  onModuleDestroy(): void {
    if (this.client.status !== 'end') {
      this.client.disconnect();
    }
  }

  async ping(): Promise<void> {
    await this.ensureConnected();
    await this.client.ping();
  }

  async setIfAbsent(key: string, value: string, ttlMs: number): Promise<boolean> {
    await this.ensureConnected();
    const result = await this.client.set(key, value, 'PX', ttlMs, 'NX');
    return result === 'OK';
  }

  async compareAndDelete(key: string, expectedValue: string): Promise<void> {
    await this.ensureConnected();
    await this.client.eval(
      `
        if redis.call("get", KEYS[1]) == ARGV[1] then
          return redis.call("del", KEYS[1])
        end
        return 0
      `,
      1,
      key,
      expectedValue,
    );
  }

  private async ensureConnected(): Promise<void> {
    if (this.client.status === 'wait') {
      await this.client.connect();
      return;
    }

    if (this.client.status === 'end') {
      throw new Error('Redis connection is closed');
    }
  }
}

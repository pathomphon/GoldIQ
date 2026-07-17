import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';

import type { DistributedLockPort } from '../../shared/domain/distributed-lock.port';
import { RedisService } from './redis.service';

@Injectable()
export class RedisDistributedLockAdapter implements DistributedLockPort {
  constructor(
    @Inject(RedisService)
    private readonly redis: RedisService,
  ) {}

  async runWithLock<T>(key: string, ttlMs: number, task: () => Promise<T>): Promise<T | null> {
    const token = randomUUID();
    const acquired = await this.redis.setIfAbsent(key, token, ttlMs);

    if (!acquired) {
      return null;
    }

    try {
      return await task();
    } finally {
      await this.redis.compareAndDelete(key, token);
    }
  }
}

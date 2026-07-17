import { Inject, Injectable } from '@nestjs/common';

import type { DependencyHealthPort } from '../../modules/health/domain/dependency-health.port';
import { RedisService } from './redis.service';

@Injectable()
export class RedisHealthAdapter implements DependencyHealthPort {
  constructor(
    @Inject(RedisService)
    private readonly redis: RedisService,
  ) {}

  async ping(): Promise<void> {
    await this.redis.ping();
  }
}

import { Global, Module } from '@nestjs/common';

import { CACHE_HEALTH_PORT } from '../../modules/health/domain/dependency-health.port';
import { DISTRIBUTED_LOCK_PORT } from '../../shared/domain/distributed-lock.port';
import { RedisDistributedLockAdapter } from './redis-distributed-lock.adapter';
import { RedisHealthAdapter } from './redis-health.adapter';
import { RedisService } from './redis.service';

@Global()
@Module({
  providers: [
    RedisService,
    RedisHealthAdapter,
    RedisDistributedLockAdapter,
    {
      provide: CACHE_HEALTH_PORT,
      useExisting: RedisHealthAdapter,
    },
    {
      provide: DISTRIBUTED_LOCK_PORT,
      useExisting: RedisDistributedLockAdapter,
    },
  ],
  exports: [CACHE_HEALTH_PORT, DISTRIBUTED_LOCK_PORT],
})
export class CacheModule {}

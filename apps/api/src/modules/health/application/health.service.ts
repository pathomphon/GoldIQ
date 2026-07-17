import { Inject, Injectable } from '@nestjs/common';

import {
  CACHE_HEALTH_PORT,
  DATABASE_HEALTH_PORT,
  type DependencyHealthPort,
} from '../domain/dependency-health.port';
import type { DependencyHealth, ReadinessResult } from '../domain/health.types';

const CHECK_TIMEOUT_MS = 2_000;

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Unknown dependency error';
}

@Injectable()
export class HealthService {
  constructor(
    @Inject(DATABASE_HEALTH_PORT)
    private readonly databaseHealth: DependencyHealthPort,
    @Inject(CACHE_HEALTH_PORT)
    private readonly cacheHealth: DependencyHealthPort,
  ) {}

  liveness(): {
    readonly status: 'ok';
    readonly service: 'goldiq-api';
    readonly timestamp: string;
  } {
    return {
      status: 'ok',
      service: 'goldiq-api',
      timestamp: new Date().toISOString(),
    };
  }

  async readiness(): Promise<ReadinessResult> {
    const [database, cache] = await Promise.all([
      this.check('postgresql', this.databaseHealth),
      this.check('redis', this.cacheHealth),
    ]);
    const checks: DependencyHealth[] = [
      { name: 'api', status: 'up', latencyMs: 0 },
      database,
      cache,
    ];

    return {
      status: checks.every((check) => check.status === 'up') ? 'ok' : 'error',
      checkedAt: new Date().toISOString(),
      checks,
    };
  }

  private async check(
    name: 'postgresql' | 'redis',
    dependency: DependencyHealthPort,
  ): Promise<DependencyHealth> {
    const startedAt = performance.now();

    try {
      await Promise.race([
        dependency.ping(),
        new Promise<never>((_, reject) => {
          setTimeout(() => {
            reject(new Error(`${name} health check timed out`));
          }, CHECK_TIMEOUT_MS);
        }),
      ]);

      return {
        name,
        status: 'up',
        latencyMs: Math.round(performance.now() - startedAt),
      };
    } catch (error: unknown) {
      return {
        name,
        status: 'down',
        latencyMs: Math.round(performance.now() - startedAt),
        message: errorMessage(error),
      };
    }
  }
}

import { describe, expect, it, vi } from 'vitest';

import type { DependencyHealthPort } from '../domain/dependency-health.port';
import { HealthService } from './health.service';

describe('HealthService', () => {
  it('reports dependencies in a stable normalized shape', async () => {
    const healthyPort: DependencyHealthPort = { ping: vi.fn().mockResolvedValue(undefined) };
    const service = new HealthService(healthyPort, healthyPort);

    const result = await service.readiness();

    expect(result.status).toBe('ok');
    expect(result.checks.map((check) => check.name)).toEqual(['api', 'postgresql', 'redis']);
    expect(result.checks.every((check) => check.status === 'up')).toBe(true);
  });

  it('returns an error result without throwing when a dependency is down', async () => {
    const database: DependencyHealthPort = {
      ping: vi.fn().mockRejectedValue(new Error('database unavailable')),
    };
    const cache: DependencyHealthPort = { ping: vi.fn().mockResolvedValue(undefined) };
    const service = new HealthService(database, cache);

    const result = await service.readiness();

    expect(result.status).toBe('error');
    expect(result.checks[1]).toMatchObject({
      name: 'postgresql',
      status: 'down',
      message: 'database unavailable',
    });
  });
});

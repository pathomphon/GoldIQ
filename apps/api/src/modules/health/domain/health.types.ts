export type HealthState = 'up' | 'down';

export interface DependencyHealth {
  readonly name: 'api' | 'postgresql' | 'redis';
  readonly status: HealthState;
  readonly latencyMs: number;
  readonly message?: string;
}

export interface ReadinessResult {
  readonly status: 'ok' | 'error';
  readonly checkedAt: string;
  readonly checks: readonly DependencyHealth[];
}

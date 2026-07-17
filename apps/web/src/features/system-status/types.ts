export type DependencyStatus = 'up' | 'down' | 'unknown';

export interface DependencyCheck {
  readonly name: 'api' | 'postgresql' | 'redis';
  readonly status: DependencyStatus;
  readonly latencyMs: number | null;
  readonly message?: string;
}

export interface SystemReadiness {
  readonly status: 'ok' | 'error';
  readonly checkedAt: string;
  readonly checks: readonly DependencyCheck[];
}

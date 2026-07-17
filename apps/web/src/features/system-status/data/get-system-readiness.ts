import type { DependencyCheck, SystemReadiness } from '@/features/system-status/types';

const dependencyNames = ['api', 'postgresql', 'redis'] as const;

function unavailableReadiness(message: string): SystemReadiness {
  const checks: DependencyCheck[] = dependencyNames.map((name) => ({
    name,
    status: 'unknown',
    latencyMs: null,
    message,
  }));

  return {
    status: 'error',
    checkedAt: new Date().toISOString(),
    checks,
  };
}

function isDependencyCheck(value: unknown): value is DependencyCheck {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  return (
    dependencyNames.includes(candidate.name as (typeof dependencyNames)[number]) &&
    ['up', 'down', 'unknown'].includes(String(candidate.status)) &&
    (typeof candidate.latencyMs === 'number' || candidate.latencyMs === null)
  );
}

function isSystemReadiness(value: unknown): value is SystemReadiness {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  return (
    ['ok', 'error'].includes(String(candidate.status)) &&
    typeof candidate.checkedAt === 'string' &&
    Array.isArray(candidate.checks) &&
    candidate.checks.every(isDependencyCheck)
  );
}

export async function getSystemReadiness(): Promise<SystemReadiness> {
  const baseUrl = process.env.GOLDIQ_API_URL ?? 'http://localhost:4000/api/v1';

  try {
    const response = await fetch(`${baseUrl}/health/readiness`, {
      cache: 'no-store',
      signal: AbortSignal.timeout(5_000),
    });
    const payload: unknown = await response.json();

    if (!isSystemReadiness(payload)) {
      return unavailableReadiness('The API returned an unexpected readiness payload.');
    }

    return payload;
  } catch {
    return unavailableReadiness('The GoldIQ API is currently unreachable.');
  }
}

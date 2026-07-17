import type { BuyPlanDashboardData, BuyPlanDashboardResult } from '@/features/buy-plan/types';

const emptyDashboard: BuyPlanDashboardData = { plans: [], recentAlerts: [] };

function isDashboard(value: unknown): value is BuyPlanDashboardData {
  if (typeof value !== 'object' || value === null) return false;
  const candidate = value as Record<string, unknown>;
  return Array.isArray(candidate.plans) && Array.isArray(candidate.recentAlerts);
}

export async function getBuyPlanDashboard(): Promise<BuyPlanDashboardResult> {
  const baseUrl = process.env.GOLDIQ_API_URL ?? 'http://localhost:4000/api/v1';
  try {
    const response = await fetch(`${baseUrl}/buy-plans`, {
      cache: 'no-store',
      signal: AbortSignal.timeout(5_000),
    });
    if (!response.ok) {
      return {
        dashboard: emptyDashboard,
        error: `Buy plan service returned HTTP ${response.status}.`,
      };
    }
    const payload: unknown = await response.json();
    return isDashboard(payload)
      ? { dashboard: payload, error: null }
      : { dashboard: emptyDashboard, error: 'Buy plan service returned an unexpected response.' };
  } catch {
    return { dashboard: emptyDashboard, error: 'Buy plan service is temporarily unavailable.' };
  }
}

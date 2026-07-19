import type { PortfolioDashboardData, PortfolioDashboardResult } from '@/features/portfolio/types';

const emptyDashboard: PortfolioDashboardData = {
  metrics: {
    totalInvested: 0,
    totalGoldWeight: 0,
    averageCost: 0,
    currentValue: 0,
    profitLoss: 0,
    profitLossPercentage: 0,
    breakEvenPrice: 0,
    valuedGoldWeight: 0,
    unvaluedGoldWeight: 0,
    realizedProfitLoss: 0,
    winRate: null,
    winningLots: 0,
    losingLots: 0,
    breakEvenLots: 0,
    closedLots: 0,
    openLots: 0,
  },
  transactions: [],
  valuedAt: null,
};

function isDashboard(value: unknown): value is PortfolioDashboardData {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.metrics === 'object' &&
    candidate.metrics !== null &&
    Array.isArray(candidate.transactions) &&
    (typeof candidate.valuedAt === 'string' || candidate.valuedAt === null)
  );
}

export async function getPortfolioDashboard(): Promise<PortfolioDashboardResult> {
  const baseUrl = process.env.GOLDIQ_API_URL ?? 'http://localhost:4000/api/v1';

  try {
    const response = await fetch(`${baseUrl}/portfolio`, {
      cache: 'no-store',
      signal: AbortSignal.timeout(5_000),
    });
    if (!response.ok) {
      return {
        dashboard: emptyDashboard,
        error: `Portfolio service returned HTTP ${response.status}.`,
      };
    }
    const payload: unknown = await response.json();
    return isDashboard(payload)
      ? { dashboard: payload, error: null }
      : {
          dashboard: emptyDashboard,
          error: 'Portfolio service returned an unexpected response.',
        };
  } catch {
    return {
      dashboard: emptyDashboard,
      error: 'Portfolio service is temporarily unavailable.',
    };
  }
}

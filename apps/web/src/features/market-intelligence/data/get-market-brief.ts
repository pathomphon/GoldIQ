import type { MarketBrief, MarketBriefResult } from '@/features/market-intelligence/types';

function isMarketBrief(value: unknown): value is MarketBrief {
  if (typeof value !== 'object' || value === null) return false;
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.id === 'string' &&
    typeof candidate.generatedAt === 'string' &&
    typeof candidate.stance === 'string' &&
    typeof candidate.confidence === 'number' &&
    typeof candidate.summary === 'string' &&
    Array.isArray(candidate.bullishFactors) &&
    Array.isArray(candidate.bearishFactors) &&
    Array.isArray(candidate.riskFlags) &&
    Array.isArray(candidate.unknowns) &&
    Array.isArray(candidate.evidence)
  );
}

export async function getMarketBrief(): Promise<MarketBriefResult> {
  const baseUrl = process.env.GOLDIQ_API_URL ?? 'http://localhost:4000/api/v1';
  try {
    const response = await fetch(`${baseUrl}/news/brief/latest`, {
      cache: 'no-store',
      signal: AbortSignal.timeout(5_000),
    });
    if (!response.ok) {
      return { data: null, error: `Research service returned HTTP ${response.status}.` };
    }
    const payload: unknown = await response.json();
    if (typeof payload !== 'object' || payload === null) {
      return { data: null, error: 'Research service returned an unexpected response.' };
    }
    const data = (payload as Record<string, unknown>).data;
    return data === null || isMarketBrief(data)
      ? { data, error: null }
      : { data: null, error: 'Research service returned an unexpected market brief.' };
  } catch {
    return { data: null, error: 'Research service is temporarily unavailable.' };
  }
}

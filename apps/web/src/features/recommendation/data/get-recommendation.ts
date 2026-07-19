import type { Recommendation, RecommendationResult } from '@/features/recommendation/types';

function isRecommendation(value: unknown): value is Recommendation {
  if (typeof value !== 'object' || value === null) return false;
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.action === 'string' &&
    Array.isArray(candidate.reasons) &&
    typeof candidate.allocation === 'object' &&
    candidate.allocation !== null &&
    typeof candidate.market === 'object' &&
    candidate.market !== null &&
    typeof candidate.settings === 'object' &&
    candidate.settings !== null
  );
}

export async function getRecommendation(): Promise<RecommendationResult> {
  const baseUrl = process.env.GOLDIQ_API_URL ?? 'http://localhost:4000/api/v1';
  try {
    const response = await fetch(`${baseUrl}/recommendations/current`, {
      cache: 'no-store',
      signal: AbortSignal.timeout(5_000),
    });
    if (!response.ok) {
      return { data: null, error: `Recommendation service returned HTTP ${response.status}.` };
    }
    const payload: unknown = await response.json();
    return isRecommendation(payload)
      ? { data: payload, error: null }
      : { data: null, error: 'Recommendation service returned an unexpected response.' };
  } catch {
    return { data: null, error: 'Recommendation service is temporarily unavailable.' };
  }
}

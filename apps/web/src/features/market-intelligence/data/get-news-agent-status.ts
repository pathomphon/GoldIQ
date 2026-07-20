import type { NewsAgentStatus, NewsAgentStatusResult } from '@/features/market-intelligence/types';

function isNewsAgentStatus(value: unknown): value is NewsAgentStatus {
  if (typeof value !== 'object' || value === null) return false;
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.newsScheduler === 'object' &&
    typeof candidate.researchAgentScheduler === 'object' &&
    typeof candidate.provider === 'object' &&
    typeof candidate.latestBrief === 'object'
  );
}

export async function getNewsAgentStatus(): Promise<NewsAgentStatusResult> {
  const baseUrl = process.env.GOLDIQ_API_URL ?? 'http://localhost:4000/api/v1';
  try {
    const response = await fetch(`${baseUrl}/news/agent-status`, {
      cache: 'no-store',
      signal: AbortSignal.timeout(5_000),
    });
    if (!response.ok) {
      return { data: null, error: `News agent service returned HTTP ${response.status}.` };
    }
    const payload: unknown = await response.json();
    return isNewsAgentStatus(payload)
      ? { data: payload, error: null }
      : { data: null, error: 'News agent service returned invalid status data.' };
  } catch {
    return { data: null, error: 'News agent service is temporarily unavailable.' };
  }
}

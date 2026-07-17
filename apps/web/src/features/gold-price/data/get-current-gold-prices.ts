import {
  goldProductCodes,
  type CurrentGoldPrices,
  type GoldPriceSnapshot,
} from '@/features/gold-price/types';

function isGoldPriceSnapshot(value: unknown): value is GoldPriceSnapshot {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  return (
    goldProductCodes.includes(candidate.productCode as (typeof goldProductCodes)[number]) &&
    typeof candidate.productName === 'string' &&
    typeof candidate.purity === 'number' &&
    typeof candidate.buyPrice === 'number' &&
    typeof candidate.sellPrice === 'number' &&
    (typeof candidate.buyChange === 'number' || candidate.buyChange === null) &&
    (typeof candidate.sellChange === 'number' || candidate.sellChange === null) &&
    typeof candidate.sourceUpdatedAt === 'string'
  );
}

function parseResponse(payload: unknown): readonly GoldPriceSnapshot[] | null {
  if (typeof payload !== 'object' || payload === null) {
    return null;
  }

  const data = (payload as Record<string, unknown>).data;
  return Array.isArray(data) && data.every(isGoldPriceSnapshot) ? data : null;
}

export async function getCurrentGoldPrices(): Promise<CurrentGoldPrices> {
  const baseUrl = process.env.GOLDIQ_API_URL ?? 'http://localhost:4000/api/v1';

  try {
    const response = await fetch(`${baseUrl}/gold-prices/current`, {
      cache: 'no-store',
      signal: AbortSignal.timeout(5_000),
    });

    if (!response.ok) {
      return {
        data: [],
        error: `Price service returned HTTP ${response.status}.`,
      };
    }

    const prices = parseResponse((await response.json()) as unknown);
    if (!prices) {
      return {
        data: [],
        error: 'Price service returned an unexpected response.',
      };
    }

    return { data: prices, error: null };
  } catch {
    return {
      data: [],
      error: 'Current prices are temporarily unavailable.',
    };
  }
}

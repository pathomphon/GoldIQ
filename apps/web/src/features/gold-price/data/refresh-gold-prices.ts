const API_BASE_URL = process.env.GOLDIQ_API_URL ?? 'http://localhost:4000/api/v1';

export async function refreshGoldPrices(): Promise<{ readonly insertedCount: number }> {
  const response = await fetch(`${API_BASE_URL}/gold-prices/refresh`, {
    method: 'POST',
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`Failed to refresh gold prices (${response.status})`);
  }

  return (await response.json()) as { insertedCount: number };
}

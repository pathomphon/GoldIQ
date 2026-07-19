import type { AnalysisResult, TechnicalAnalysis } from '@/features/analysis/types';
import type { GoldProductCode } from '@/features/gold-price/types';

export async function getTechnicalAnalysis(
  productCode: GoldProductCode,
  limit: number,
): Promise<AnalysisResult> {
  const baseUrl = process.env.GOLDIQ_API_URL ?? 'http://localhost:4000/api/v1';
  try {
    const response = await fetch(
      `${baseUrl}/gold-prices/analysis?productCode=${productCode}&limit=${limit}`,
      { cache: 'no-store', signal: AbortSignal.timeout(5_000) },
    );
    if (!response.ok)
      return { data: null, error: `Analysis service returned HTTP ${response.status}.` };
    return { data: (await response.json()) as TechnicalAnalysis, error: null };
  } catch {
    return { data: null, error: 'ข้อมูลวิเคราะห์ไม่พร้อมใช้งานชั่วคราว' };
  }
}

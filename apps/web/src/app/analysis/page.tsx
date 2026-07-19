import { AnalysisDashboard } from '@/features/analysis/components/analysis-dashboard';
import { getTechnicalAnalysis } from '@/features/analysis/data/get-technical-analysis';
import { goldProductCodes, type GoldProductCode } from '@/features/gold-price/types';

export const dynamic = 'force-dynamic';

export default async function AnalysisPage({
  searchParams,
}: {
  readonly searchParams: Promise<{ product?: string; limit?: string }>;
}) {
  const params = await searchParams;
  const productCode = goldProductCodes.includes(params.product as GoldProductCode)
    ? (params.product as GoldProductCode)
    : 'GOLD_BAR_965';
  const requested = Number(params.limit ?? 100);
  const limit = [100, 200, 300, 400, 500].includes(requested) ? requested : 100;
  const result = await getTechnicalAnalysis(productCode, limit);
  return <AnalysisDashboard result={result} productCode={productCode} limit={limit} />;
}

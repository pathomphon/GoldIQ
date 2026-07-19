import { getMarketBrief } from '@/features/market-intelligence/data/get-market-brief';
import { RecommendationDashboard } from '@/features/recommendation/components/recommendation-dashboard';
import { getRecommendation } from '@/features/recommendation/data/get-recommendation';

export const dynamic = 'force-dynamic';

export default async function RecommendationPage() {
  const [result, marketBrief] = await Promise.all([getRecommendation(), getMarketBrief()]);
  return <RecommendationDashboard marketBrief={marketBrief} result={result} />;
}

import type { Metadata } from 'next';

import { getTechnicalAnalysis } from '@/features/analysis/data/get-technical-analysis';
import { BuyPlanDashboard } from '@/features/buy-plan/components/buy-plan-dashboard';
import { getBuyPlanDashboard } from '@/features/buy-plan/data/get-buy-plan-dashboard';
import { getCurrentGoldPrices } from '@/features/gold-price/data/get-current-gold-prices';
import { getRecommendation } from '@/features/recommendation/data/get-recommendation';

export const metadata: Metadata = { title: 'GoldIQ · Buy Plan' };
export const dynamic = 'force-dynamic';

export default async function BuyPlanPage() {
  const [dashboardRes, pricesRes, recommendationRes, analysisRes] = await Promise.all([
    getBuyPlanDashboard(),
    getCurrentGoldPrices(),
    getRecommendation(),
    getTechnicalAnalysis('GOLD_BAR_965', 50),
  ]);

  const mergedResult = {
    ...dashboardRes,
    currentPrices: pricesRes.data,
    recommendation: recommendationRes.data,
    analysis: analysisRes.data,
  };

  return <BuyPlanDashboard result={mergedResult} />;
}


import { getTechnicalAnalysis } from '@/features/analysis/data/get-technical-analysis';
import { GoldPriceBoard } from '@/features/gold-price/components/gold-price-board';
import { getCurrentGoldPrices } from '@/features/gold-price/data/get-current-gold-prices';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const [prices, analysis] = await Promise.all([
    getCurrentGoldPrices(),
    getTechnicalAnalysis('GOLD_BAR_965', 50),
  ]);

  return <GoldPriceBoard analysis={analysis} prices={prices} />;
}


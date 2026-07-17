import { GoldPriceBoard } from '@/features/gold-price/components/gold-price-board';
import { getCurrentGoldPrices } from '@/features/gold-price/data/get-current-gold-prices';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const prices = await getCurrentGoldPrices();

  return <GoldPriceBoard prices={prices} />;
}

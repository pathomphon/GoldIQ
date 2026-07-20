import type { Metadata } from 'next';

import { BuyPlanDashboard } from '@/features/buy-plan/components/buy-plan-dashboard';
import { getBuyPlanDashboard } from '@/features/buy-plan/data/get-buy-plan-dashboard';

export const metadata: Metadata = { title: 'GoldIQ · Buy Plan' };
export const dynamic = 'force-dynamic';

export default async function BuyPlanPage() {
  return <BuyPlanDashboard result={await getBuyPlanDashboard()} />;
}

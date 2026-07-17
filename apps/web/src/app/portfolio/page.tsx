import { PortfolioDashboard } from '@/features/portfolio/components/portfolio-dashboard';
import { getPortfolioDashboard } from '@/features/portfolio/data/get-portfolio-dashboard';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  title: 'GoldIQ · Portfolio',
  description: 'Gold portfolio value, cost basis and purchase transactions.',
};

export default async function PortfolioPage() {
  const result = await getPortfolioDashboard();
  return <PortfolioDashboard result={result} />;
}

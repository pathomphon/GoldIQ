import { render, screen } from '@testing-library/react';
import { vi, describe, expect, it } from 'vitest';

import { PortfolioDashboard } from './portfolio-dashboard';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));

describe('PortfolioDashboard', () => {
  it('renders calculated metrics and a stored transaction', () => {
    render(
      <PortfolioDashboard
        result={{
          error: null,
          dashboard: {
            metrics: {
              totalInvested: 20_000,
              totalGoldWeight: 0.315956,
              averageCost: 63_300,
              currentValue: 20_076,
              profitLoss: 76,
              profitLossPercentage: 0.38,
              breakEvenPrice: 63_300,
              valuedGoldWeight: 0.315956,
              unvaluedGoldWeight: 0,
              realizedProfitLoss: 1_860,
              winRate: 50,
              winningLots: 1,
              losingLots: 1,
              breakEvenLots: 0,
              closedLots: 2,
              openLots: 1,
            },
            valuedAt: '2026-07-17T14:40:00.000Z',
            transactions: [
              {
                id: 'transaction-1',
                productCode: 'GOLD_BAR_965',
                productName: 'ทองคำแท่ง 96.5%',
                purchasedAt: '2026-07-01T03:00:00.000Z',
                purchasePrice: 63_300,
                investmentAmount: 20_000,
                goldWeight: 0.315956,
                fee: 0,
                notes: null,
                createdAt: '2026-07-01T03:00:00.000Z',
                updatedAt: '2026-07-01T03:00:00.000Z',
                remainingGoldWeight: 0.215956,
                realizedProfitLoss: 1_860,
                status: 'PARTIALLY_SOLD',
                sales: [
                  {
                    id: 'sale-1',
                    purchaseTransactionId: 'transaction-1',
                    soldAt: '2026-07-10T03:00:00.000Z',
                    salePrice: 65_000,
                    goldWeight: 0.1,
                    fee: 50,
                    notes: null,
                    createdAt: '2026-07-10T03:00:00.000Z',
                    updatedAt: '2026-07-10T03:00:00.000Z',
                    grossProceeds: 6_500,
                    netProceeds: 6_450,
                    allocatedCost: 6_330,
                    realizedProfitLoss: 120,
                  },
                ],
              },
            ],
          },
        }}
      />,
    );

    expect(screen.getByRole('heading', { name: 'พอร์ตทองของคุณ' })).toBeInTheDocument();
    expect(screen.getByText('฿20,076.00')).toBeInTheDocument();
    expect(screen.getAllByText('ทองคำแท่ง 96.5%')).toHaveLength(2);
    expect(screen.getByText('Win Rate')).toBeInTheDocument();
    expect(screen.getByText('50.00%')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'บันทึกขาย' })).toBeInTheDocument();
    expect(screen.getByText('ประวัติการขาย')).toBeInTheDocument();
  });
});

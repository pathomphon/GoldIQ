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
              },
            ],
          },
        }}
      />,
    );

    expect(screen.getByRole('heading', { name: 'พอร์ตทองของคุณ' })).toBeInTheDocument();
    expect(screen.getByText('฿20,076.00')).toBeInTheDocument();
    expect(screen.getAllByText('ทองคำแท่ง 96.5%')).toHaveLength(2);
  });
});

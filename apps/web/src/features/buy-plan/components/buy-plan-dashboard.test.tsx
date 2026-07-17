import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { BuyPlanDashboard } from './buy-plan-dashboard';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));

describe('BuyPlanDashboard', () => {
  it('renders plan levels and alert history', () => {
    render(
      <BuyPlanDashboard
        result={{
          error: null,
          dashboard: {
            plans: [
              {
                id: 'plan-1',
                name: 'แผนหลัก',
                productCode: 'GOLD_BAR_965',
                productName: 'ทองคำแท่ง 96.5%',
                isActive: true,
                createdAt: '2026-07-17T00:00:00.000Z',
                levels: [
                  {
                    id: 'level-1',
                    targetPrice: 63_300,
                    investmentAmount: 20_000,
                    sequence: 1,
                    status: 'WAITING',
                    triggeredAt: null,
                    executedAt: null,
                  },
                ],
              },
            ],
            recentAlerts: [],
          },
        }}
      />,
    );
    expect(screen.getByRole('heading', { name: 'แผนแบ่งไม้ซื้อทอง' })).toBeInTheDocument();
    expect(screen.getByText('แผนหลัก')).toBeInTheDocument();
    expect(screen.getByText('เป้า ฿63,300')).toBeInTheDocument();
  });
});

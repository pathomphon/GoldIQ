import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { RecommendationDashboard } from './recommendation-dashboard';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));

describe('RecommendationDashboard', () => {
  it('renders the recommendation reasons and settings', () => {
    render(
      <RecommendationDashboard
        marketBrief={{ data: null, error: null }}
        result={{
          error: null,
          data: {
            action: 'WAIT',
            reasons: ['ราคายังไม่ถึง Buy Level #1'],
            recommendedAmount: 0,
            sellPartialPercent: null,
            allocation: { availableCash: 50_000, reservedCash: 10_000, deployableCash: 25_000 },
            market: {
              observedAt: '2026-07-19T10:00:00Z',
              currentBuyPrice: 63_000,
              currentSellPrice: 63_100,
              totalInvested: 0,
              totalGoldWeight: 0,
              averageCost: 0,
              currentValue: 0,
              profitLossPercentage: 0,
              nextBuyLevel: null,
            },
            settings: {
              riskProfile: 'BALANCED',
              availableCash: 50_000,
              minimumCashReserve: 10_000,
              maxAllocationPercent: 50,
              profitTargetPercent: 5,
              sellPartialPercent: 25,
              stopBuyAbovePrice: null,
            },
            marketIntelligence: {
              mode: 'SHADOW',
              enabled: true,
              status: 'ACTIVE',
              effect: 'SUPPORTS',
              baseAction: 'WAIT',
              shadowAction: 'WAIT',
              liveAction: 'WAIT',
              reasons: ['Bearish evidence supports keeping the conservative WAIT action.'],
              brief: {
                id: 'brief-1',
                generatedAt: '2026-07-19T10:05:00Z',
                stance: 'BEARISH',
                confidence: 0.45,
                isStale: false,
              },
            },
          },
        }}
      />,
    );
    expect(screen.getByText('WAIT')).toBeInTheDocument();
    expect(screen.getByText('ราคายังไม่ถึง Buy Level #1')).toBeInTheDocument();
    expect(screen.getByLabelText('เงินสดที่มีอยู่')).toHaveValue(50_000);
    expect(screen.getByText('Conservative shadow mode')).toBeInTheDocument();
    expect(screen.getByText('BEARISH · confidence 45%')).toBeInTheDocument();
  });
});

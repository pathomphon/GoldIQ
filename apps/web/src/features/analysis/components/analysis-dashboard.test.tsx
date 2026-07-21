import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { AnalysisDashboard } from './analysis-dashboard';

vi.mock('lightweight-charts', () => ({
  createChart: () => ({
    addSeries: () => ({
      setData: vi.fn(),
      createPriceLine: vi.fn(() => ({})),
      removePriceLine: vi.fn(),
    }),
    addLineSeries: () => ({
      setData: vi.fn(),
      createPriceLine: vi.fn(() => ({})),
      removePriceLine: vi.fn(),
    }),
    subscribeCrosshairMove: vi.fn(),
    timeScale: () => ({ fitContent: vi.fn() }),
    applyOptions: vi.fn(),
    remove: vi.fn(),
  }),
  LineSeries: {},
  ColorType: { Solid: 'solid' },
  LineStyle: { Dashed: 1 },
}));

if (typeof global.ResizeObserver === 'undefined') {
  global.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}

describe('AnalysisDashboard', () => {
  it('renders live analysis values and insufficient-data states', () => {
    render(
      <AnalysisDashboard
        limit={100}
        productCode="GOLD_BAR_965"
        result={{
          error: null,
          data: {
            productCode: 'GOLD_BAR_965',
            samples: [
              { timestamp: '2026-07-19T00:00:00.000Z', buyPrice: 63_500, sellPrice: 63_600 },
              { timestamp: '2026-07-19T00:01:00.000Z', buyPrice: 63_550, sellPrice: 63_650 },
            ],
            ema: { '20': null, '50': null, '100': null, '200': null },
            rsi: null,
            macd: null,
            support: [63_600],
            resistance: [63_650],
          },
        }}
      />,
    );

    expect(screen.getByRole('heading', { name: 'วิเคราะห์ราคาทอง' })).toBeInTheDocument();
    expect(
      screen.getByLabelText(/กราฟประวัติราคารับซื้อและขายออก/),
    ).toBeInTheDocument();
    expect(screen.getAllByText('ข้อมูลยังไม่เพียงพอ')).not.toHaveLength(0);
  });
});


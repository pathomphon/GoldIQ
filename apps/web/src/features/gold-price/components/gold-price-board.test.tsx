import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { GoldPriceBoard } from './gold-price-board';

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    refresh: vi.fn(),
  }),
}));

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

describe('GoldPriceBoard', () => {
  it('renders normalized current prices', () => {
    render(
      <GoldPriceBoard
        prices={{
          error: null,
          data: [
            {
              id: 'price-1',
              productCode: 'GOLD_BAR_965',
              productName: 'ทองคำแท่ง 96.5%',
              purity: 96.5,
              buyPrice: 63_550,
              sellPrice: 63_640,
              buyChange: -20,
              sellChange: -20,
              source: 'HUA_SENG_HENG',
              sourceUpdatedAt: '2026-07-17T14:21:41.000Z',
              fetchedAt: '2026-07-17T14:22:00.000Z',
              rawResponseHash: 'a'.repeat(64),
            },
          ],
        }}
      />,
    );

    expect(screen.getByRole('heading', { name: 'ราคาทองวันนี้' })).toBeInTheDocument();
    expect(screen.getByText('ทองคำแท่ง 96.5%')).toBeInTheDocument();
    expect(screen.getByText('฿63,550.00')).toBeInTheDocument();
  });

  it('renders interactive trend chart when analysis data is supplied', () => {
    render(
      <GoldPriceBoard
        analysis={{
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
            support: [63_400],
            resistance: [63_800],
          },
        }}
        prices={{ error: null, data: [] }}
      />,
    );

    expect(screen.getByRole('heading', { name: 'แนวโน้มราคาทองคำแท่ง 96.5%' })).toBeInTheDocument();
  });
});


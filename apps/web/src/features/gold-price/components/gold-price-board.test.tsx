import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { GoldPriceBoard } from './gold-price-board';

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
});

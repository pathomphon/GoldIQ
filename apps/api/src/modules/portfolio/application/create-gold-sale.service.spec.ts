import { ConflictException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';

import type { PortfolioRepositoryPort } from '../domain/portfolio.repository.port';
import type { GoldSale, GoldTransaction } from '../domain/portfolio.types';
import { CreateGoldSaleService } from './create-gold-sale.service';

const sale: GoldSale = {
  id: 'sale-1',
  purchaseTransactionId: 'transaction-1',
  soldAt: new Date('2026-07-10T03:00:00.000Z'),
  salePrice: 65_000,
  goldWeight: 0.4,
  fee: 100,
  notes: null,
  createdAt: new Date('2026-07-10T03:00:00.000Z'),
  updatedAt: new Date('2026-07-10T03:00:00.000Z'),
};

const transaction: GoldTransaction = {
  id: 'transaction-1',
  productCode: 'GOLD_BAR_965',
  productName: 'ทองคำแท่ง 96.5%',
  purchasedAt: new Date('2026-07-01T03:00:00.000Z'),
  purchasePrice: 60_000,
  investmentAmount: 60_000,
  goldWeight: 1,
  fee: 100,
  notes: null,
  createdAt: new Date('2026-07-01T03:00:00.000Z'),
  updatedAt: new Date('2026-07-01T03:00:00.000Z'),
  sales: [sale],
};

describe('CreateGoldSaleService', () => {
  it('returns a sale with allocated cost and realized profit', async () => {
    const repository = {
      createSale: vi.fn().mockResolvedValue({ ok: true, sale, transaction }),
    } as unknown as PortfolioRepositoryPort;
    const service = new CreateGoldSaleService(repository);

    await expect(
      service.execute({
        purchaseTransactionId: 'transaction-1',
        soldAt: sale.soldAt,
        salePrice: sale.salePrice,
        goldWeight: sale.goldWeight,
        fee: sale.fee,
        notes: sale.notes,
      }),
    ).resolves.toMatchObject({
      grossProceeds: 26_000,
      netProceeds: 25_900,
      allocatedCost: 24_040,
      realizedProfitLoss: 1_860,
    });
  });

  it('maps insufficient remaining weight to a conflict response', async () => {
    const repository = {
      createSale: vi.fn().mockResolvedValue({ ok: false, reason: 'INSUFFICIENT_WEIGHT' as const }),
    } as unknown as PortfolioRepositoryPort;
    const service = new CreateGoldSaleService(repository);

    await expect(
      service.execute({
        purchaseTransactionId: 'transaction-1',
        soldAt: sale.soldAt,
        salePrice: sale.salePrice,
        goldWeight: sale.goldWeight,
        fee: sale.fee,
        notes: sale.notes,
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });
});

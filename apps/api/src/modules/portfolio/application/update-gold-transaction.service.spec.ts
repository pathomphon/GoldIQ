import { ConflictException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';

import type { PortfolioRepositoryPort } from '../domain/portfolio.repository.port';
import type { GoldTransaction } from '../domain/portfolio.types';
import { UpdateGoldTransactionService } from './update-gold-transaction.service';

const existing: GoldTransaction = {
  id: 'transaction-1',
  productCode: 'GOLD_BAR_965',
  productName: 'ทองคำแท่ง 96.5%',
  purchasedAt: new Date('2026-07-01T03:00:00.000Z'),
  purchasePrice: 60_000,
  investmentAmount: 30_000,
  goldWeight: 0.5,
  fee: 50,
  notes: null,
  createdAt: new Date('2026-07-01T03:00:00.000Z'),
  updatedAt: new Date('2026-07-01T03:00:00.000Z'),
};

describe('UpdateGoldTransactionService', () => {
  it('recalculates weight when purchase values change', async () => {
    const findTransaction = vi.fn().mockResolvedValue(existing);
    const updateTransaction = vi
      .fn()
      .mockImplementation((_id: string, input: object) =>
        Promise.resolve({ ...existing, ...input }),
      );
    const repository: PortfolioRepositoryPort = {
      findTransactions: vi.fn(),
      findTransaction,
      createTransaction: vi.fn(),
      updateTransaction,
      deleteTransaction: vi.fn(),
      findSale: vi.fn(),
      createSale: vi.fn(),
      updateSale: vi.fn(),
      deleteSale: vi.fn(),
      findCurrentBuyPrices: vi.fn(),
      findLatestPriceTimestamp: vi.fn(),
    };
    const service = new UpdateGoldTransactionService(repository);

    await service.execute(existing.id, {
      purchasePrice: 63_300,
      investmentAmount: 20_000,
    });

    expect(updateTransaction).toHaveBeenCalledWith(
      existing.id,
      expect.objectContaining({ goldWeight: 0.315956 }),
    );
  });

  it('rejects changing the product after a sale has been recorded', async () => {
    const updateTransaction = vi.fn();
    const repository = {
      findTransaction: vi.fn().mockResolvedValue({
        ...existing,
        sales: [
          {
            id: 'sale-1',
            purchaseTransactionId: existing.id,
            soldAt: new Date('2026-07-10T03:00:00.000Z'),
            salePrice: 65_000,
            goldWeight: 0.1,
            fee: 0,
            notes: null,
            createdAt: new Date('2026-07-10T03:00:00.000Z'),
            updatedAt: new Date('2026-07-10T03:00:00.000Z'),
          },
        ],
      }),
      updateTransaction,
    } as unknown as PortfolioRepositoryPort;
    const service = new UpdateGoldTransactionService(repository);

    await expect(service.execute(existing.id, { productCode: 'GOLD_9999' })).rejects.toBeInstanceOf(
      ConflictException,
    );
    expect(updateTransaction).not.toHaveBeenCalled();
  });
});

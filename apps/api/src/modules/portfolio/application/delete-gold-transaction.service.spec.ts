import { ConflictException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';

import type { PortfolioRepositoryPort } from '../domain/portfolio.repository.port';
import { DeleteGoldTransactionService } from './delete-gold-transaction.service';

describe('DeleteGoldTransactionService', () => {
  it('rejects deleting a purchase that has sale history', async () => {
    const deleteTransaction = vi.fn();
    const repository = {
      findTransaction: vi.fn().mockResolvedValue({
        id: 'transaction-1',
        sales: [{ id: 'sale-1' }],
      }),
      deleteTransaction,
    } as unknown as PortfolioRepositoryPort;
    const service = new DeleteGoldTransactionService(repository);

    await expect(service.execute('transaction-1')).rejects.toBeInstanceOf(ConflictException);
    expect(deleteTransaction).not.toHaveBeenCalled();
  });
});

import { Inject, Injectable, NotFoundException } from '@nestjs/common';

import { calculateGoldWeight } from '../domain/portfolio.calculator';
import {
  PORTFOLIO_REPOSITORY_PORT,
  type PortfolioRepositoryPort,
} from '../domain/portfolio.repository.port';
import type { GoldTransaction } from '../domain/portfolio.types';
import type { UpdateGoldTransactionCommand } from './portfolio.commands';

@Injectable()
export class UpdateGoldTransactionService {
  constructor(
    @Inject(PORTFOLIO_REPOSITORY_PORT)
    private readonly repository: PortfolioRepositoryPort,
  ) {}

  async execute(id: string, command: UpdateGoldTransactionCommand): Promise<GoldTransaction> {
    const existing = await this.repository.findTransaction(id);
    if (!existing) {
      throw new NotFoundException('Gold transaction not found');
    }

    const purchasePrice = command.purchasePrice ?? existing.purchasePrice;
    const investmentAmount = command.investmentAmount ?? existing.investmentAmount;
    const updated = await this.repository.updateTransaction(id, {
      productCode: command.productCode ?? existing.productCode,
      purchasedAt: command.purchasedAt ?? existing.purchasedAt,
      purchasePrice,
      investmentAmount,
      goldWeight: calculateGoldWeight(investmentAmount, purchasePrice),
      fee: command.fee ?? existing.fee,
      notes: command.notes === undefined ? existing.notes : command.notes,
    });

    if (!updated) {
      throw new NotFoundException('Gold transaction not found');
    }
    return updated;
  }
}

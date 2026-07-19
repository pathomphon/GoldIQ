import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

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
    const purchasedAt = command.purchasedAt ?? existing.purchasedAt;
    const productCode = command.productCode ?? existing.productCode;
    const goldWeight = calculateGoldWeight(investmentAmount, purchasePrice);
    const sales = existing.sales ?? [];

    if (sales.length > 0 && productCode !== existing.productCode) {
      throw new ConflictException('Gold product cannot be changed after a sale is recorded');
    }
    if (sales.some((sale) => purchasedAt > sale.soldAt)) {
      throw new BadRequestException('Purchase date cannot be after a recorded sale date');
    }
    const soldWeight = sales.reduce((sum, sale) => sum + sale.goldWeight, 0);
    if (goldWeight + 0.0000005 < soldWeight) {
      throw new ConflictException('Updated purchase weight cannot be lower than sold weight');
    }

    const updated = await this.repository.updateTransaction(id, {
      productCode,
      purchasedAt,
      purchasePrice,
      investmentAmount,
      goldWeight,
      fee: command.fee ?? existing.fee,
      notes: command.notes === undefined ? existing.notes : command.notes,
    });

    if (!updated) {
      throw new NotFoundException('Gold transaction not found');
    }
    return updated;
  }
}

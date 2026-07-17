import { Inject, Injectable } from '@nestjs/common';

import { calculateGoldWeight } from '../domain/portfolio.calculator';
import {
  PORTFOLIO_REPOSITORY_PORT,
  type PortfolioRepositoryPort,
} from '../domain/portfolio.repository.port';
import type { GoldTransaction } from '../domain/portfolio.types';
import type { CreateGoldTransactionCommand } from './portfolio.commands';

@Injectable()
export class CreateGoldTransactionService {
  constructor(
    @Inject(PORTFOLIO_REPOSITORY_PORT)
    private readonly repository: PortfolioRepositoryPort,
  ) {}

  execute(command: CreateGoldTransactionCommand): Promise<GoldTransaction> {
    return this.repository.createTransaction({
      ...command,
      goldWeight: calculateGoldWeight(command.investmentAmount, command.purchasePrice),
    });
  }
}

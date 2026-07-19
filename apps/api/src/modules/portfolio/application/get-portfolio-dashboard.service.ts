import { Inject, Injectable } from '@nestjs/common';

import {
  buildPortfolioTransaction,
  calculatePortfolioMetrics,
} from '../domain/portfolio.calculator';
import {
  PORTFOLIO_REPOSITORY_PORT,
  type PortfolioRepositoryPort,
} from '../domain/portfolio.repository.port';
import type { PortfolioDashboard } from '../domain/portfolio.types';

@Injectable()
export class GetPortfolioDashboardService {
  constructor(
    @Inject(PORTFOLIO_REPOSITORY_PORT)
    private readonly repository: PortfolioRepositoryPort,
  ) {}

  async execute(): Promise<PortfolioDashboard> {
    const [transactions, currentPrices, valuedAt] = await Promise.all([
      this.repository.findTransactions(),
      this.repository.findCurrentBuyPrices(),
      this.repository.findLatestPriceTimestamp(),
    ]);

    return {
      metrics: calculatePortfolioMetrics(transactions, currentPrices),
      transactions: transactions.map(buildPortfolioTransaction),
      valuedAt,
    };
  }
}

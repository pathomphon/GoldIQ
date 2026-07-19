import { Inject, Injectable, NotFoundException } from '@nestjs/common';

import {
  PORTFOLIO_REPOSITORY_PORT,
  type PortfolioRepositoryPort,
} from '../domain/portfolio.repository.port';

@Injectable()
export class DeleteGoldSaleService {
  constructor(
    @Inject(PORTFOLIO_REPOSITORY_PORT)
    private readonly repository: PortfolioRepositoryPort,
  ) {}

  async execute(id: string): Promise<void> {
    if (!(await this.repository.deleteSale(id))) {
      throw new NotFoundException('Gold sale not found');
    }
  }
}

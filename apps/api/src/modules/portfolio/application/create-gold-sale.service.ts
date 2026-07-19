import { Inject, Injectable } from '@nestjs/common';

import {
  PORTFOLIO_REPOSITORY_PORT,
  type PortfolioRepositoryPort,
} from '../domain/portfolio.repository.port';
import type { PortfolioSale } from '../domain/portfolio.types';
import type { CreateGoldSaleCommand } from './portfolio.commands';
import { resolveSaleMutation } from './sale-mutation.result';

@Injectable()
export class CreateGoldSaleService {
  constructor(
    @Inject(PORTFOLIO_REPOSITORY_PORT)
    private readonly repository: PortfolioRepositoryPort,
  ) {}

  async execute(command: CreateGoldSaleCommand): Promise<PortfolioSale> {
    return resolveSaleMutation(await this.repository.createSale(command));
  }
}

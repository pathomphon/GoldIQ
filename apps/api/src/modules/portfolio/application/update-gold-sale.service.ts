import { Inject, Injectable, NotFoundException } from '@nestjs/common';

import {
  PORTFOLIO_REPOSITORY_PORT,
  type PortfolioRepositoryPort,
} from '../domain/portfolio.repository.port';
import type { PortfolioSale } from '../domain/portfolio.types';
import type { UpdateGoldSaleCommand } from './portfolio.commands';
import { resolveSaleMutation } from './sale-mutation.result';

@Injectable()
export class UpdateGoldSaleService {
  constructor(
    @Inject(PORTFOLIO_REPOSITORY_PORT)
    private readonly repository: PortfolioRepositoryPort,
  ) {}

  async execute(id: string, command: UpdateGoldSaleCommand): Promise<PortfolioSale> {
    const existing = await this.repository.findSale(id);
    if (!existing) {
      throw new NotFoundException('Gold sale not found');
    }

    return resolveSaleMutation(
      await this.repository.updateSale(id, {
        soldAt: command.soldAt ?? existing.soldAt,
        salePrice: command.salePrice ?? existing.salePrice,
        goldWeight: command.goldWeight ?? existing.goldWeight,
        fee: command.fee ?? existing.fee,
        notes: command.notes === undefined ? existing.notes : command.notes,
      }),
    );
  }
}

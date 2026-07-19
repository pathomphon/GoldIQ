import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';

import { calculateSalePerformance } from '../domain/portfolio.calculator';
import type { SaleMutationResult } from '../domain/portfolio.repository.port';
import type { PortfolioSale } from '../domain/portfolio.types';

export function resolveSaleMutation(result: SaleMutationResult): PortfolioSale {
  if (result.ok) {
    return {
      ...result.sale,
      ...calculateSalePerformance(result.transaction, result.sale),
    };
  }

  switch (result.reason) {
    case 'PURCHASE_NOT_FOUND':
      throw new NotFoundException('Gold purchase transaction not found');
    case 'SALE_NOT_FOUND':
      throw new NotFoundException('Gold sale not found');
    case 'SALE_BEFORE_PURCHASE':
      throw new BadRequestException('Sale date cannot be before purchase date');
    case 'INSUFFICIENT_WEIGHT':
      throw new ConflictException('Sale weight exceeds the remaining gold weight');
  }
}

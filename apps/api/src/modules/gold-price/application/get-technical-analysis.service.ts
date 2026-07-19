import { Inject, Injectable } from '@nestjs/common';

import type { GoldProductCode } from '../domain/gold-product';
import {
  GOLD_PRICE_REPOSITORY_PORT,
  type GoldPriceRepositoryPort,
} from '../domain/gold-price-repository.port';
import { calculateTechnicalAnalysis, type TechnicalAnalysis } from '../domain/technical-analysis';

@Injectable()
export class GetTechnicalAnalysisService {
  constructor(
    @Inject(GOLD_PRICE_REPOSITORY_PORT)
    private readonly repository: GoldPriceRepositoryPort,
  ) {}

  async execute(productCode: GoldProductCode, limit: number): Promise<TechnicalAnalysis> {
    const history = await this.repository.findHistory(productCode, Math.min(limit, 500));
    return calculateTechnicalAnalysis(productCode, history);
  }
}

import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import type { AppEnvironment } from '../../../config/environment.schema';
import type { GoldProductCode } from '../domain/gold-product';
import {
  GOLD_PRICE_REPOSITORY_PORT,
  type GoldPriceRepositoryPort,
} from '../domain/gold-price-repository.port';
import type { GoldPriceSnapshot } from '../domain/gold-price.types';

@Injectable()
export class GetGoldPriceHistoryService {
  private readonly defaultLimit: number;
  private readonly maxLimit: number;

  constructor(
    @Inject(GOLD_PRICE_REPOSITORY_PORT)
    private readonly repository: GoldPriceRepositoryPort,
    config: ConfigService<AppEnvironment, true>,
  ) {
    this.defaultLimit = config.get('goldPriceHistory.defaultLimit', {
      infer: true,
    });
    this.maxLimit = config.get('goldPriceHistory.maxLimit', { infer: true });
  }

  execute(
    productCode: GoldProductCode | undefined,
    requestedLimit: number | undefined,
  ): Promise<readonly GoldPriceSnapshot[]> {
    const limit = Math.min(requestedLimit ?? this.defaultLimit, this.maxLimit);
    return this.repository.findHistory(productCode, limit);
  }
}

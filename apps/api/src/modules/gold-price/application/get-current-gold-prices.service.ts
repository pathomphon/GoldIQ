import { Inject, Injectable } from '@nestjs/common';

import {
  GOLD_PRICE_REPOSITORY_PORT,
  type GoldPriceRepositoryPort,
} from '../domain/gold-price-repository.port';
import type { GoldPriceSnapshot } from '../domain/gold-price.types';

@Injectable()
export class GetCurrentGoldPricesService {
  constructor(
    @Inject(GOLD_PRICE_REPOSITORY_PORT)
    private readonly repository: GoldPriceRepositoryPort,
  ) {}

  execute(): Promise<readonly GoldPriceSnapshot[]> {
    return this.repository.findCurrentPrices();
  }
}

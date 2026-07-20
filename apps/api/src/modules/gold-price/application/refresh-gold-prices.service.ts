import { Inject, Injectable } from '@nestjs/common';

import {
  GOLD_PRICE_PROVIDER_PORT,
  type GoldPriceProviderPort,
} from '../domain/gold-price-provider.port';
import {
  GOLD_PRICE_REPOSITORY_PORT,
  type GoldPriceRepositoryPort,
} from '../domain/gold-price-repository.port';
import type { SaveGoldPricesResult } from '../domain/gold-price.types';

@Injectable()
export class RefreshGoldPricesService {
  constructor(
    @Inject(GOLD_PRICE_PROVIDER_PORT)
    private readonly provider: GoldPriceProviderPort,
    @Inject(GOLD_PRICE_REPOSITORY_PORT)
    private readonly repository: GoldPriceRepositoryPort,
  ) {}

  async execute(): Promise<SaveGoldPricesResult> {
    const quotes = await this.provider.fetchCurrentPrices();
    const result = await this.repository.saveQuotes(quotes);
    await this.repository.upsertCandles(quotes);
    return result;
  }
}

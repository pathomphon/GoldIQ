import { Inject, Injectable } from '@nestjs/common';

import type { GoldProductCode } from '../domain/gold-product';
import {
  GOLD_PRICE_REPOSITORY_PORT,
  type GoldPriceRepositoryPort,
} from '../domain/gold-price-repository.port';
import type {
  CandleResolution,
  ChartTimeframe,
  GoldPriceCandleSnapshot,
} from '../domain/gold-price.types';

export interface GetGoldPriceCandlesOptions {
  readonly productCode?: GoldProductCode;
  readonly resolution?: CandleResolution;
  readonly timeframe?: ChartTimeframe;
  readonly from?: Date;
  readonly to?: Date;
  readonly limit?: number;
}

@Injectable()
export class GetGoldPriceCandlesService {
  constructor(
    @Inject(GOLD_PRICE_REPOSITORY_PORT)
    private readonly repository: GoldPriceRepositoryPort,
  ) {}

  execute(options: GetGoldPriceCandlesOptions): Promise<readonly GoldPriceCandleSnapshot[]> {
    const productCode: GoldProductCode = options.productCode ?? 'GOLD_BAR_965';
    let resolution: CandleResolution = options.resolution ?? 'M1';
    let from = options.from;
    const to = options.to;
    const limit = options.limit ?? 500;

    if (options.timeframe) {
      const now = new Date();

      if (!options.resolution) {
        switch (options.timeframe) {
          case 'INTRADAY':
            resolution = 'M1';
            break;
          case '7D':
            resolution = 'H1';
            break;
          case '30D':
            resolution = 'H1';
            break;
          case '3M':
            resolution = 'D1';
            break;
          case '1Y':
          case 'ALL':
            resolution = 'D1';
            break;
        }
      }

      if (!from) {
        switch (options.timeframe) {
          case 'INTRADAY':
            from = new Date(now.getTime() - 24 * 60 * 60 * 1000);
            break;
          case '7D':
            from = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            break;
          case '30D':
            from = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            break;
          case '3M':
            from = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
            break;
          case '1Y':
            from = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
            break;
          case 'ALL':
            from = undefined;
            break;
        }
      }
    }

    return this.repository.findCandles({
      productCode,
      resolution,
      from,
      to,
      limit,
    });
  }
}

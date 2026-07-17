import { Controller, Get, Inject, Query } from '@nestjs/common';

import { GetCurrentGoldPricesService } from '../application/get-current-gold-prices.service';
import { GetGoldPriceHistoryService } from '../application/get-gold-price-history.service';
import type { GoldProductCode } from '../domain/gold-product';
import type { GoldPriceSnapshot } from '../domain/gold-price.types';
import { ParseHistoryLimitPipe } from './pipes/parse-history-limit.pipe';
import { ParseGoldProductCodePipe } from './pipes/parse-gold-product-code.pipe';

interface GoldPriceResponse {
  readonly data: readonly GoldPriceSnapshot[];
}

@Controller('gold-prices')
export class GoldPriceController {
  constructor(
    @Inject(GetCurrentGoldPricesService)
    private readonly getCurrentGoldPrices: GetCurrentGoldPricesService,
    @Inject(GetGoldPriceHistoryService)
    private readonly getGoldPriceHistory: GetGoldPriceHistoryService,
  ) {}

  @Get('current')
  async current(): Promise<GoldPriceResponse> {
    return { data: await this.getCurrentGoldPrices.execute() };
  }

  @Get('history')
  async history(
    @Query('productCode', ParseGoldProductCodePipe)
    productCode: GoldProductCode | undefined,
    @Query('limit', ParseHistoryLimitPipe)
    limit: number | undefined,
  ): Promise<GoldPriceResponse> {
    return {
      data: await this.getGoldPriceHistory.execute(productCode, limit),
    };
  }
}

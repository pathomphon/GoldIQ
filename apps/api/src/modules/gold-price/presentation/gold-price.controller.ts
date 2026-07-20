import { Controller, Get, Inject, Post, Query } from '@nestjs/common';

import { GetCurrentGoldPricesService } from '../application/get-current-gold-prices.service';
import { GetGoldPriceCandlesService } from '../application/get-gold-price-candles.service';
import { GetGoldPriceHistoryService } from '../application/get-gold-price-history.service';
import { GetTechnicalAnalysisService } from '../application/get-technical-analysis.service';
import { RefreshGoldPricesService } from '../application/refresh-gold-prices.service';
import type { GoldProductCode } from '../domain/gold-product';
import type {
  CandleResolution,
  ChartTimeframe,
  GoldPriceCandleSnapshot,
  GoldPriceSnapshot,
  SaveGoldPricesResult,
} from '../domain/gold-price.types';
import type { TechnicalAnalysis } from '../domain/technical-analysis';
import { ParseCandleResolutionPipe } from './pipes/parse-candle-resolution.pipe';
import { ParseChartTimeframePipe } from './pipes/parse-chart-timeframe.pipe';
import { ParseGoldProductCodePipe } from './pipes/parse-gold-product-code.pipe';
import { ParseHistoryLimitPipe } from './pipes/parse-history-limit.pipe';

interface GoldPriceResponse {
  readonly data: readonly GoldPriceSnapshot[];
}

interface GoldPriceCandlesResponse {
  readonly data: readonly GoldPriceCandleSnapshot[];
}

@Controller('gold-prices')
export class GoldPriceController {
  constructor(
    @Inject(GetCurrentGoldPricesService)
    private readonly getCurrentGoldPrices: GetCurrentGoldPricesService,
    @Inject(GetGoldPriceHistoryService)
    private readonly getGoldPriceHistory: GetGoldPriceHistoryService,
    @Inject(GetGoldPriceCandlesService)
    private readonly getGoldPriceCandles: GetGoldPriceCandlesService,
    @Inject(GetTechnicalAnalysisService)
    private readonly getTechnicalAnalysis: GetTechnicalAnalysisService,
    @Inject(RefreshGoldPricesService)
    private readonly refreshGoldPrices: RefreshGoldPricesService,
  ) {}

  @Get('current')
  async current(): Promise<GoldPriceResponse> {
    return { data: await this.getCurrentGoldPrices.execute() };
  }

  @Post('refresh')
  refresh(): Promise<SaveGoldPricesResult> {
    return this.refreshGoldPrices.execute();
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

  @Get('candles')
  async candles(
    @Query('productCode', ParseGoldProductCodePipe)
    productCode: GoldProductCode | undefined,
    @Query('resolution', ParseCandleResolutionPipe)
    resolution: CandleResolution | undefined,
    @Query('timeframe', ParseChartTimeframePipe)
    timeframe: ChartTimeframe | undefined,
    @Query('from')
    fromStr: string | undefined,
    @Query('to')
    toStr: string | undefined,
    @Query('limit', ParseHistoryLimitPipe)
    limit: number | undefined,
  ): Promise<GoldPriceCandlesResponse> {
    const from = fromStr ? new Date(fromStr) : undefined;
    const to = toStr ? new Date(toStr) : undefined;

    return {
      data: await this.getGoldPriceCandles.execute({
        productCode,
        resolution,
        timeframe,
        from,
        to,
        limit,
      }),
    };
  }

  @Get('analysis')
  analysis(
    @Query('productCode', ParseGoldProductCodePipe)
    productCode: GoldProductCode | undefined,
    @Query('limit', ParseHistoryLimitPipe)
    limit: number | undefined,
  ): Promise<TechnicalAnalysis> {
    return this.getTechnicalAnalysis.execute(productCode ?? 'GOLD_BAR_965', limit ?? 100);
  }
}

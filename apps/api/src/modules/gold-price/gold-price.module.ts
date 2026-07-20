import { Module } from '@nestjs/common';

import { GetCurrentGoldPricesService } from './application/get-current-gold-prices.service';
import { GetGoldPriceCandlesService } from './application/get-gold-price-candles.service';
import { GetGoldPriceHistoryService } from './application/get-gold-price-history.service';
import { GetTechnicalAnalysisService } from './application/get-technical-analysis.service';
import { GoldPriceCleanupScheduler } from './application/gold-price-cleanup.scheduler';
import { GoldPriceRefreshScheduler } from './application/gold-price-refresh.scheduler';
import { RefreshGoldPricesService } from './application/refresh-gold-prices.service';
import { GOLD_PRICE_PROVIDER_PORT } from './domain/gold-price-provider.port';
import { GOLD_PRICE_REPOSITORY_PORT } from './domain/gold-price-repository.port';
import { HuaSengHengPriceProvider } from './infrastructure/hua-seng-heng/hua-seng-heng-price.provider';
import { PrismaGoldPriceRepository } from './infrastructure/persistence/prisma-gold-price.repository';
import { GoldPriceController } from './presentation/gold-price.controller';

@Module({
  controllers: [GoldPriceController],
  providers: [
    GetCurrentGoldPricesService,
    GetGoldPriceHistoryService,
    GetGoldPriceCandlesService,
    GetTechnicalAnalysisService,
    RefreshGoldPricesService,
    GoldPriceRefreshScheduler,
    GoldPriceCleanupScheduler,
    HuaSengHengPriceProvider,
    PrismaGoldPriceRepository,
    {
      provide: GOLD_PRICE_PROVIDER_PORT,
      useExisting: HuaSengHengPriceProvider,
    },
    {
      provide: GOLD_PRICE_REPOSITORY_PORT,
      useExisting: PrismaGoldPriceRepository,
    },
  ],
  exports: [GOLD_PRICE_REPOSITORY_PORT],
})
export class GoldPriceModule {}

import { Module } from '@nestjs/common';

import { GetCurrentGoldPricesService } from './application/get-current-gold-prices.service';
import { GetGoldPriceHistoryService } from './application/get-gold-price-history.service';
import { GetTechnicalAnalysisService } from './application/get-technical-analysis.service';
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
    GetTechnicalAnalysisService,
    RefreshGoldPricesService,
    GoldPriceRefreshScheduler,
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
})
export class GoldPriceModule {}

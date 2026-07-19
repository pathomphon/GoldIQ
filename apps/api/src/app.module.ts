import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { LoggerModule } from 'nestjs-pino';

import { CacheModule } from './infrastructure/cache/cache.module';
import { DatabaseModule } from './infrastructure/database/database.module';
import { configuration } from './config/configuration';
import { validateEnvironment } from './config/environment.schema';
import { HealthModule } from './modules/health/health.module';
import { PortfolioModule } from './modules/portfolio/portfolio.module';
import { BuyPlanModule } from './modules/buy-plan/buy-plan.module';
import { GoldPriceModule } from './modules/gold-price/gold-price.module';
import { RecommendationModule } from './modules/recommendation/recommendation.module';
import { NewsIntelligenceModule } from './modules/news-intelligence/news-intelligence.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      cache: true,
      expandVariables: true,
      isGlobal: true,
      load: [configuration],
      validate: validateEnvironment,
    }),
    LoggerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        pinoHttp: {
          level: config.get<string>('LOG_LEVEL') ?? 'info',
          redact: {
            paths: [
              'req.headers.authorization',
              'req.headers.cookie',
              'req.body.password',
              'req.body.token',
              'req.body.secret',
              'res.headers["set-cookie"]',
            ],
            censor: '[REDACTED]',
          },
        },
      }),
    }),
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => [
        {
          ttl: config.get<number>('API_RATE_LIMIT_TTL_MS') ?? 60_000,
          limit: config.get<number>('API_RATE_LIMIT_MAX') ?? 120,
        },
      ],
    }),
    ScheduleModule.forRoot(),
    DatabaseModule,
    CacheModule,
    HealthModule,
    GoldPriceModule,
    PortfolioModule,
    BuyPlanModule,
    RecommendationModule,
    NewsIntelligenceModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}

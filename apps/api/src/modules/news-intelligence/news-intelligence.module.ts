import { Module } from '@nestjs/common';

import { GetNewsService } from './application/get-news.service';
import { GenerateMarketBriefService } from './application/generate-market-brief.service';
import { GetLatestMarketBriefService } from './application/get-latest-market-brief.service';
import { MarketBriefScheduler } from './application/market-brief.scheduler';
import { NewsRefreshScheduler } from './application/news-refresh.scheduler';
import { RefreshNewsService } from './application/refresh-news.service';
import { NEWS_PROVIDER_PORT } from './domain/news-provider.port';
import { NEWS_ANALYZER_PORT } from './domain/news-analyzer.port';
import { NEWS_REPOSITORY_PORT } from './domain/news-repository.port';
import { RssNewsProvider } from './infrastructure/sources/rss-news.provider';
import { PrismaNewsRepository } from './infrastructure/persistence/prisma-news.repository';
import { OpenAiNewsAnalyzerAdapter } from './infrastructure/analysis/openai-news-analyzer.adapter';
import { NewsIntelligenceController } from './presentation/news-intelligence.controller';

@Module({
  controllers: [NewsIntelligenceController],
  providers: [
    GetNewsService,
    GetLatestMarketBriefService,
    GenerateMarketBriefService,
    RefreshNewsService,
    NewsRefreshScheduler,
    MarketBriefScheduler,
    RssNewsProvider,
    OpenAiNewsAnalyzerAdapter,
    PrismaNewsRepository,
    { provide: NEWS_PROVIDER_PORT, useExisting: RssNewsProvider },
    { provide: NEWS_ANALYZER_PORT, useExisting: OpenAiNewsAnalyzerAdapter },
    { provide: NEWS_REPOSITORY_PORT, useExisting: PrismaNewsRepository },
  ],
})
export class NewsIntelligenceModule {}

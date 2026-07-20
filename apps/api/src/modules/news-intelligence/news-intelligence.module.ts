import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import type { AppEnvironment } from '../../config/environment.schema';
import { AnalyzeArticleService } from './application/analyze-article.service';
import { GenerateMarketBriefService } from './application/generate-market-brief.service';
import { GetLatestMarketBriefService } from './application/get-latest-market-brief.service';
import { GetNewsAgentStatusService } from './application/get-news-agent-status.service';
import { GetNewsService } from './application/get-news.service';
import { MarketBriefScheduler } from './application/market-brief.scheduler';
import { NewsRefreshScheduler } from './application/news-refresh.scheduler';
import { RefreshNewsService } from './application/refresh-news.service';
import { ARTICLE_ANALYZER_PORT } from './domain/article-analyzer.port';
import { NEWS_ANALYZER_PORT } from './domain/news-analyzer.port';
import { NEWS_PROVIDER_PORT } from './domain/news-provider.port';
import { NEWS_REPOSITORY_PORT } from './domain/news-repository.port';
import { OllamaArticleAnalyzerAdapter } from './infrastructure/analysis/ollama-article-analyzer.adapter';
import { OllamaNewsAnalyzerAdapter } from './infrastructure/analysis/ollama-news-analyzer.adapter';
import { OpenAiArticleAnalyzerAdapter } from './infrastructure/analysis/openai-article-analyzer.adapter';
import { OpenAiNewsAnalyzerAdapter } from './infrastructure/analysis/openai-news-analyzer.adapter';
import { PrismaNewsRepository } from './infrastructure/persistence/prisma-news.repository';
import { RssNewsProvider } from './infrastructure/sources/rss-news.provider';
import { NewsIntelligenceController } from './presentation/news-intelligence.controller';

@Module({
  controllers: [NewsIntelligenceController],
  providers: [
    GetNewsService,
    GetNewsAgentStatusService,
    GetLatestMarketBriefService,
    GenerateMarketBriefService,
    RefreshNewsService,
    AnalyzeArticleService,
    NewsRefreshScheduler,
    MarketBriefScheduler,
    RssNewsProvider,
    OpenAiNewsAnalyzerAdapter,
    OllamaNewsAnalyzerAdapter,
    OpenAiArticleAnalyzerAdapter,
    OllamaArticleAnalyzerAdapter,
    PrismaNewsRepository,
    { provide: NEWS_PROVIDER_PORT, useExisting: RssNewsProvider },
    {
      provide: NEWS_ANALYZER_PORT,
      inject: [ConfigService, OpenAiNewsAnalyzerAdapter, OllamaNewsAnalyzerAdapter],
      useFactory: (
        config: ConfigService<AppEnvironment, true>,
        openAi: OpenAiNewsAnalyzerAdapter,
        ollama: OllamaNewsAnalyzerAdapter,
      ) => (config.get('researchAgent.provider', { infer: true }) === 'ollama' ? ollama : openAi),
    },
    {
      provide: ARTICLE_ANALYZER_PORT,
      inject: [ConfigService, OpenAiArticleAnalyzerAdapter, OllamaArticleAnalyzerAdapter],
      useFactory: (
        config: ConfigService<AppEnvironment, true>,
        openAi: OpenAiArticleAnalyzerAdapter,
        ollama: OllamaArticleAnalyzerAdapter,
      ) => (config.get('researchAgent.provider', { infer: true }) === 'ollama' ? ollama : openAi),
    },
    { provide: NEWS_REPOSITORY_PORT, useExisting: PrismaNewsRepository },
  ],
  exports: [GetLatestMarketBriefService],
})
export class NewsIntelligenceModule {}

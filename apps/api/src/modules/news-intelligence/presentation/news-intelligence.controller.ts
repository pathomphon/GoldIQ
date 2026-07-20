import { Controller, Get, HttpCode, HttpStatus, Inject, Param, Post, Query } from '@nestjs/common';

import { AnalyzeArticleService } from '../application/analyze-article.service';
import { GetNewsService } from '../application/get-news.service';
import {
  GetNewsAgentStatusService,
  type NewsAgentStatus,
} from '../application/get-news-agent-status.service';
import { GetLatestMarketBriefService } from '../application/get-latest-market-brief.service';
import type { MarketBrief, NewsArticle } from '../domain/news.types';
import { type ListNewsQuery, ParseListNewsQueryPipe } from './pipes/parse-list-news-query.pipe';

interface NewsResponse {
  readonly data: readonly NewsArticle[];
}

interface MarketBriefResponse {
  readonly data: MarketBrief | null;
  readonly status: 'AVAILABLE' | 'UNAVAILABLE';
}

interface ArticleAnalysisResponse {
  readonly data: NewsArticle;
}

@Controller('news')
export class NewsIntelligenceController {
  constructor(
    @Inject(GetNewsService)
    private readonly getNews: GetNewsService,
    @Inject(GetLatestMarketBriefService)
    private readonly getLatestBrief: GetLatestMarketBriefService,
    @Inject(GetNewsAgentStatusService)
    private readonly getAgentStatus: GetNewsAgentStatusService,
    @Inject(AnalyzeArticleService)
    private readonly analyzeArticle: AnalyzeArticleService,
  ) {}

  @Get('agent-status')
  async agentStatus(): Promise<NewsAgentStatus> {
    return this.getAgentStatus.execute();
  }

  @Post(':id/analyze')
  @HttpCode(HttpStatus.OK)
  async analyze(@Param('id') id: string): Promise<ArticleAnalysisResponse> {
    const data = await this.analyzeArticle.execute(id);
    return { data };
  }

  @Get('brief/latest')
  async latestBrief(): Promise<MarketBriefResponse> {
    const brief = await this.getLatestBrief.execute();
    return { data: brief, status: brief ? 'AVAILABLE' : 'UNAVAILABLE' };
  }

  @Get()
  async list(@Query(ParseListNewsQueryPipe) query: ListNewsQuery): Promise<NewsResponse> {
    return { data: await this.getNews.execute(query.limit, query.source) };
  }
}

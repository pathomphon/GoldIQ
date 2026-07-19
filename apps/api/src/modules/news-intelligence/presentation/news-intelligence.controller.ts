import { Controller, Get, Inject, Query } from '@nestjs/common';

import { GetNewsService } from '../application/get-news.service';
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

@Controller('news')
export class NewsIntelligenceController {
  constructor(
    @Inject(GetNewsService)
    private readonly getNews: GetNewsService,
    @Inject(GetLatestMarketBriefService)
    private readonly getLatestBrief: GetLatestMarketBriefService,
  ) {}

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

import { Inject, Injectable } from '@nestjs/common';

import { NEWS_REPOSITORY_PORT, type NewsRepositoryPort } from '../domain/news-repository.port';
import type { MarketBrief } from '../domain/news.types';

@Injectable()
export class GetLatestMarketBriefService {
  constructor(
    @Inject(NEWS_REPOSITORY_PORT)
    private readonly repository: NewsRepositoryPort,
  ) {}

  execute(): Promise<MarketBrief | null> {
    return this.repository.findLatestBrief();
  }
}

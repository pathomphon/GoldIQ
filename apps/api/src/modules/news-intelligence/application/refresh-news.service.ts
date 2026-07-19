import { Inject, Injectable } from '@nestjs/common';

import { NEWS_PROVIDER_PORT, type NewsProviderPort } from '../domain/news-provider.port';
import { NEWS_REPOSITORY_PORT, type NewsRepositoryPort } from '../domain/news-repository.port';
import type { SaveNewsResult } from '../domain/news.types';

@Injectable()
export class RefreshNewsService {
  constructor(
    @Inject(NEWS_PROVIDER_PORT)
    private readonly provider: NewsProviderPort,
    @Inject(NEWS_REPOSITORY_PORT)
    private readonly repository: NewsRepositoryPort,
  ) {}

  async execute(): Promise<SaveNewsResult> {
    const fetched = await this.provider.fetchLatest();
    const inserted = await this.repository.saveArticles(fetched.articles);

    return {
      received: fetched.articles.length,
      inserted,
      duplicates: fetched.articles.length - inserted,
      sourcesAttempted: fetched.sourcesAttempted,
      sourcesSucceeded: fetched.sourcesSucceeded,
      errors: fetched.errors,
    };
  }
}

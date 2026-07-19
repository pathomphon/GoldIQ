import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import type { AppEnvironment } from '../../../config/environment.schema';
import { NEWS_REPOSITORY_PORT, type NewsRepositoryPort } from '../domain/news-repository.port';
import type { NewsArticle } from '../domain/news.types';

@Injectable()
export class GetNewsService {
  private readonly defaultLimit: number;
  private readonly maxLimit: number;

  constructor(
    @Inject(NEWS_REPOSITORY_PORT)
    private readonly repository: NewsRepositoryPort,
    config: ConfigService<AppEnvironment, true>,
  ) {
    this.defaultLimit = config.get('news.defaultLimit', { infer: true });
    this.maxLimit = config.get('news.maxLimit', { infer: true });
  }

  execute(limit: number | undefined, source: string | undefined): Promise<readonly NewsArticle[]> {
    return this.repository.findArticles({
      limit: Math.min(limit ?? this.defaultLimit, this.maxLimit),
      source,
    });
  }
}

import { Inject, Injectable, NotFoundException } from '@nestjs/common';

import { ARTICLE_ANALYZER_PORT, type ArticleAnalyzerPort } from '../domain/article-analyzer.port';
import { NEWS_REPOSITORY_PORT, type NewsRepositoryPort } from '../domain/news-repository.port';
import type { NewsArticle } from '../domain/news.types';

@Injectable()
export class AnalyzeArticleService {
  constructor(
    @Inject(ARTICLE_ANALYZER_PORT)
    private readonly analyzer: ArticleAnalyzerPort,
    @Inject(NEWS_REPOSITORY_PORT)
    private readonly repository: NewsRepositoryPort,
  ) {}

  async execute(articleId: string): Promise<NewsArticle> {
    const article = await this.repository.findArticleById(articleId);
    if (!article) {
      throw new NotFoundException(`News article with ID "${articleId}" not found`);
    }

    const analysis = await this.analyzer.analyzeArticle(article);
    return this.repository.saveArticleAnalysis(articleId, analysis);
  }
}

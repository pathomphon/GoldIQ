import type { ArticleAnalysis } from './article-analysis.schema';
import type {
  FindNewsQuery,
  MarketBrief,
  MarketBriefAnalysis,
  NewsArticle,
  NormalizedNewsArticle,
} from './news.types';

export const NEWS_REPOSITORY_PORT = Symbol('NEWS_REPOSITORY_PORT');

export interface NewsRepositoryPort {
  saveArticles(articles: readonly NormalizedNewsArticle[]): Promise<number>;
  findArticles(query: FindNewsQuery): Promise<readonly NewsArticle[]>;
  findArticleById(id: string): Promise<NewsArticle | null>;
  findAnalysisCandidates(since: Date, limit: number): Promise<readonly NewsArticle[]>;
  saveArticleAnalysis(id: string, analysis: ArticleAnalysis): Promise<NewsArticle>;
  findLatestBrief(): Promise<MarketBrief | null>;
  saveBrief(input: {
    analysis: MarketBriefAnalysis;
    confidence: number;
    windowStart: Date;
    windowEnd: Date;
    expiresAt: Date;
    evidenceIds: readonly string[];
  }): Promise<MarketBrief>;
}

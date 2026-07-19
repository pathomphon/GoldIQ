import type { MarketBriefAnalysis, NewsArticle } from './news.types';

export const NEWS_ANALYZER_PORT = Symbol('NEWS_ANALYZER_PORT');

export interface NewsAnalyzerPort {
  analyze(articles: readonly NewsArticle[]): Promise<MarketBriefAnalysis>;
}

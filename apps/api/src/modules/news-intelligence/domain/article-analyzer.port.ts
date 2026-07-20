import type { ArticleAnalysis } from './article-analysis.schema';
import type { NewsArticle } from './news.types';

export const ARTICLE_ANALYZER_PORT = Symbol('ARTICLE_ANALYZER_PORT');

export interface ArticleAnalyzerPort {
  analyzeArticle(article: NewsArticle): Promise<ArticleAnalysis>;
}

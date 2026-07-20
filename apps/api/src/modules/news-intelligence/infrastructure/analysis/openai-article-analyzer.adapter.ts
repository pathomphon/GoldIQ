import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { zodTextFormat } from 'openai/helpers/zod';

import type { AppEnvironment } from '../../../../config/environment.schema';
import type { ArticleAnalyzerPort } from '../../domain/article-analyzer.port';
import {
  type ArticleAnalysis,
  articleAnalysisSchema,
  SINGLE_ARTICLE_SYSTEM_PROMPT,
} from '../../domain/article-analysis.schema';
import type { NewsArticle } from '../../domain/news.types';

@Injectable()
export class OpenAiArticleAnalyzerAdapter implements ArticleAnalyzerPort {
  private readonly client: OpenAI | undefined;
  private readonly model: string;

  constructor(
    @Inject(ConfigService)
    config: ConfigService<AppEnvironment, true>,
  ) {
    const apiKey = config.get('researchAgent.openAiApiKey', { infer: true });
    this.model = config.get('researchAgent.model', { infer: true });
    this.client = apiKey
      ? new OpenAI({
          apiKey,
          maxRetries: 0,
          timeout: config.get('researchAgent.timeoutMs', { infer: true }),
        })
      : undefined;
  }

  async analyzeArticle(article: NewsArticle): Promise<ArticleAnalysis> {
    if (!this.client) {
      throw new Error('OpenAI Article Analyzer is not configured with an API key');
    }

    const response = await this.client.responses.parse({
      model: this.model,
      input: [
        { role: 'system', content: SINGLE_ARTICLE_SYSTEM_PROMPT },
        {
          role: 'user',
          content:
            `Analyze this news article for gold market impact:\n\n` +
            `Title: ${article.title}\n` +
            `Source: ${article.source} (${article.sourceTier})\n` +
            `Published: ${article.publishedAt.toISOString()}\n` +
            `Content/Excerpt: ${article.excerpt ?? 'No content provided'}`,
        },
      ],
      max_output_tokens: 1_500,
      store: false,
      text: {
        format: zodTextFormat(articleAnalysisSchema, 'gold_article_analysis'),
      },
    });

    if (!response.output_parsed) {
      throw new Error('OpenAI returned no structured article analysis');
    }

    return response.output_parsed;
  }
}

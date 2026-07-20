import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { z } from 'zod';

import type { AppEnvironment } from '../../../../config/environment.schema';
import type { ArticleAnalyzerPort } from '../../domain/article-analyzer.port';
import {
  type ArticleAnalysis,
  articleAnalysisSchema,
  SINGLE_ARTICLE_SYSTEM_PROMPT,
} from '../../domain/article-analysis.schema';
import type { NewsArticle } from '../../domain/news.types';

const ollamaResponseSchema = z.object({
  model: z.string(),
  created_at: z.string().optional(),
  message: z.object({
    content: z.string(),
  }),
});

const OLLAMA_UNSUPPORTED_SCHEMA_KEYS = new Set([
  '$schema',
  'additionalProperties',
  'minLength',
  'maxLength',
  'minItems',
  'maxItems',
]);

function ollamaCompatibleSchema(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(ollamaCompatibleSchema);
  if (typeof value !== 'object' || value === null) return value;

  return Object.fromEntries(
    Object.entries(value)
      .filter(([key]) => !OLLAMA_UNSUPPORTED_SCHEMA_KEYS.has(key))
      .map(([key, child]) => [key, ollamaCompatibleSchema(child)]),
  );
}

@Injectable()
export class OllamaArticleAnalyzerAdapter implements ArticleAnalyzerPort {
  private readonly baseUrl: string;
  private readonly model: string;
  private readonly timeoutMs: number;

  constructor(
    @Inject(ConfigService)
    config: ConfigService<AppEnvironment, true>,
  ) {
    this.baseUrl = config.get('researchAgent.ollamaBaseUrl', { infer: true }).replace(/\/+$/, '');
    this.model = config.get('researchAgent.model', { infer: true });
    this.timeoutMs = config.get('researchAgent.timeoutMs', { infer: true });
  }

  async analyzeArticle(article: NewsArticle): Promise<ArticleAnalysis> {
    const outputSchema = ollamaCompatibleSchema(z.toJSONSchema(articleAnalysisSchema));
    const response = await fetch(`${this.baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      signal: AbortSignal.timeout(this.timeoutMs),
      body: JSON.stringify({
        model: this.model,
        stream: false,
        think: false,
        messages: [
          { role: 'system', content: SINGLE_ARTICLE_SYSTEM_PROMPT },
          {
            role: 'user',
            content:
              `Analyze this news article for gold market impact:\n\n` +
              `Title: ${article.title}\n` +
              `Source: ${article.source} (${article.sourceTier})\n` +
              `Published: ${article.publishedAt.toISOString()}\n` +
              `Content/Excerpt: ${article.excerpt ?? 'No content provided'}\n\n` +
              `Return valid JSON only matching the schema requirements.`,
          },
        ],
        format: outputSchema,
        options: {
          temperature: 0,
          num_predict: 1_500,
        },
      }),
    });

    if (!response.ok) {
      const errorBody = (await response.text()).slice(0, 500);
      throw new Error(`Ollama single article analysis failed (${response.status}): ${errorBody}`);
    }

    const ollamaResponse = ollamaResponseSchema.parse(await response.json());
    return articleAnalysisSchema.parse(JSON.parse(ollamaResponse.message.content));
  }
}

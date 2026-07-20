import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { z } from 'zod';

import type { AppEnvironment } from '../../../../config/environment.schema';
import type { NewsAnalyzerPort } from '../../domain/news-analyzer.port';
import type { MarketBriefAnalysis, NewsArticle } from '../../domain/news.types';
import {
  buildResearchEvidence,
  marketBriefSchema,
  RESEARCH_AGENT_SYSTEM_PROMPT,
} from './market-brief-analysis.schema';

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
export class OllamaNewsAnalyzerAdapter implements NewsAnalyzerPort {
  private readonly baseUrl: string;
  private readonly model: string;
  private readonly promptVersion: string;
  private readonly timeoutMs: number;

  constructor(
    @Inject(ConfigService)
    config: ConfigService<AppEnvironment, true>,
  ) {
    this.baseUrl = config.get('researchAgent.ollamaBaseUrl', { infer: true }).replace(/\/+$/, '');
    this.model = config.get('researchAgent.model', { infer: true });
    this.promptVersion = config.get('researchAgent.promptVersion', { infer: true });
    this.timeoutMs = config.get('researchAgent.timeoutMs', { infer: true });
  }

  async analyze(articles: readonly NewsArticle[]): Promise<MarketBriefAnalysis> {
    const evidence = buildResearchEvidence(articles);
    const outputSchema = ollamaCompatibleSchema(z.toJSONSchema(marketBriefSchema));
    const response = await fetch(`${this.baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      signal: AbortSignal.timeout(this.timeoutMs),
      body: JSON.stringify({
        model: this.model,
        stream: false,
        think: false,
        messages: [
          { role: 'system', content: RESEARCH_AGENT_SYSTEM_PROMPT },
          {
            role: 'user',
            content:
              'ข้อกำหนดสำคัญ: เขียนข้อความใน summary, text ของทุก factor, riskFlags ' +
              'และ unknowns เป็นภาษาไทยเท่านั้น แม้หลักฐานต้นฉบับจะเป็นภาษาอังกฤษ\n\n' +
              `สร้างบทวิเคราะห์ตลาดทองคำจากหลักฐาน JSON นี้:\n${JSON.stringify(evidence)}\n\n` +
              'Return only the valid JSON object required by the response schema.',
          },
        ],
        format: outputSchema,
        options: {
          temperature: 0,
          num_predict: 2_500,
        },
      }),
    });

    if (!response.ok) {
      const errorBody = (await response.text()).slice(0, 500);
      throw new Error(`Ollama request failed (${response.status}): ${errorBody}`);
    }

    const ollamaResponse = ollamaResponseSchema.parse(await response.json());
    const analysis = marketBriefSchema.parse(JSON.parse(ollamaResponse.message.content));

    return {
      ...analysis,
      provider: 'OLLAMA',
      model: ollamaResponse.model || this.model,
      promptVersion: this.promptVersion,
      responseId: null,
    };
  }
}

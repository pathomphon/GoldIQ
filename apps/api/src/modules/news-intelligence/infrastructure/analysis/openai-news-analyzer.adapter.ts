import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { zodTextFormat } from 'openai/helpers/zod';

import type { AppEnvironment } from '../../../../config/environment.schema';
import type { NewsAnalyzerPort } from '../../domain/news-analyzer.port';
import type { MarketBriefAnalysis, NewsArticle } from '../../domain/news.types';
import {
  buildResearchEvidence,
  marketBriefSchema,
  RESEARCH_AGENT_SYSTEM_PROMPT,
} from './market-brief-analysis.schema';

@Injectable()
export class OpenAiNewsAnalyzerAdapter implements NewsAnalyzerPort {
  private readonly client: OpenAI | undefined;
  private readonly model: string;
  private readonly promptVersion: string;

  constructor(
    @Inject(ConfigService)
    config: ConfigService<AppEnvironment, true>,
  ) {
    const apiKey = config.get('researchAgent.openAiApiKey', { infer: true });
    this.model = config.get('researchAgent.model', { infer: true });
    this.promptVersion = config.get('researchAgent.promptVersion', { infer: true });
    this.client = apiKey
      ? new OpenAI({
          apiKey,
          maxRetries: 0,
          timeout: config.get('researchAgent.timeoutMs', { infer: true }),
        })
      : undefined;
  }

  async analyze(articles: readonly NewsArticle[]): Promise<MarketBriefAnalysis> {
    if (!this.client) throw new Error('OpenAI Research Agent is not configured');

    const evidence = buildResearchEvidence(articles);
    const response = await this.client.responses.parse({
      model: this.model,
      input: [
        { role: 'system', content: RESEARCH_AGENT_SYSTEM_PROMPT },
        {
          role: 'user',
          content: `Create a market brief from this JSON evidence:\n${JSON.stringify(evidence)}`,
        },
      ],
      max_output_tokens: 2_500,
      store: false,
      text: {
        format: zodTextFormat(marketBriefSchema, 'gold_market_brief'),
      },
    });
    if (!response.output_parsed) {
      throw new Error('Research Agent returned no structured market brief');
    }

    return {
      ...response.output_parsed,
      provider: 'OPENAI',
      model: this.model,
      promptVersion: this.promptVersion,
      responseId: response.id,
    };
  }
}

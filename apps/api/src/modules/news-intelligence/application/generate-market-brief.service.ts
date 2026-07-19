import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import type { AppEnvironment } from '../../../config/environment.schema';
import { assertGroundedAnalysis, calculateDataConfidence } from '../domain/market-brief';
import { NEWS_ANALYZER_PORT, type NewsAnalyzerPort } from '../domain/news-analyzer.port';
import { NEWS_REPOSITORY_PORT, type NewsRepositoryPort } from '../domain/news-repository.port';
import type { MarketBrief } from '../domain/news.types';

export type GenerateMarketBriefResult =
  | { readonly status: 'CREATED'; readonly brief: MarketBrief }
  | { readonly status: 'SKIPPED_NO_EVIDENCE' | 'SKIPPED_NO_CHANGES'; readonly brief: null };

@Injectable()
export class GenerateMarketBriefService {
  private readonly windowHours: number;
  private readonly maxArticles: number;
  private readonly briefTtlMinutes: number;

  constructor(
    @Inject(NEWS_ANALYZER_PORT)
    private readonly analyzer: NewsAnalyzerPort,
    @Inject(NEWS_REPOSITORY_PORT)
    private readonly repository: NewsRepositoryPort,
    config: ConfigService<AppEnvironment, true>,
  ) {
    this.windowHours = config.get('researchAgent.windowHours', { infer: true });
    this.maxArticles = config.get('researchAgent.maxArticles', { infer: true });
    this.briefTtlMinutes = config.get('researchAgent.briefTtlMinutes', { infer: true });
  }

  async execute(now = new Date()): Promise<GenerateMarketBriefResult> {
    const windowStart = new Date(now.getTime() - this.windowHours * 3_600_000);
    const [articles, latest] = await Promise.all([
      this.repository.findAnalysisCandidates(windowStart, this.maxArticles),
      this.repository.findLatestBrief(),
    ]);
    if (articles.length === 0) return { status: 'SKIPPED_NO_EVIDENCE', brief: null };
    if (latest && articles.every((article) => article.fetchedAt <= latest.generatedAt)) {
      return { status: 'SKIPPED_NO_CHANGES', brief: null };
    }

    const analysis = await this.analyzer.analyze(articles);
    assertGroundedAnalysis(analysis, articles);
    const citedIds = new Set([
      ...analysis.evidenceIds,
      ...analysis.bullishFactors.flatMap((factor) => factor.evidenceIds),
      ...analysis.bearishFactors.flatMap((factor) => factor.evidenceIds),
    ]);
    const citedArticles = articles.filter((article) => citedIds.has(article.id));
    const confidence = calculateDataConfidence(citedArticles, now, this.windowHours);
    const brief = await this.repository.saveBrief({
      analysis,
      confidence,
      windowStart,
      windowEnd: now,
      expiresAt: new Date(now.getTime() + this.briefTtlMinutes * 60_000),
      evidenceIds: citedArticles.map((article) => article.id),
    });

    return { status: 'CREATED', brief };
  }
}

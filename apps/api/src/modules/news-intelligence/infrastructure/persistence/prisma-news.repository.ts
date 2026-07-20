import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';

import { PrismaService } from '../../../../infrastructure/database/prisma.service';
import type { NewsRepositoryPort } from '../../domain/news-repository.port';
import type {
  FindNewsQuery,
  MarketBrief,
  MarketBriefAnalysis,
  MarketBriefFactor,
  NewsArticle,
  NewsSourceTier,
  NormalizedNewsArticle,
} from '../../domain/news.types';

import { type ArticleAnalysis, articleAnalysisSchema } from '../../domain/article-analysis.schema';

function toArticle(record: {
  id: string;
  source: string;
  canonicalUrl: string;
  title: string;
  excerpt: string | null;
  sourceTier: string;
  publishedAt: Date;
  fetchedAt: Date;
  analysis?: Prisma.JsonValue;
}): NewsArticle {
  let parsedAnalysis: ArticleAnalysis | null = null;
  if (record.analysis && typeof record.analysis === 'object') {
    const parseResult = articleAnalysisSchema.safeParse(record.analysis);
    if (parseResult.success) {
      parsedAnalysis = parseResult.data;
    }
  }

  return {
    id: record.id,
    source: record.source,
    canonicalUrl: record.canonicalUrl,
    title: record.title,
    excerpt: record.excerpt,
    sourceTier: record.sourceTier as NewsSourceTier,
    publishedAt: record.publishedAt,
    fetchedAt: record.fetchedAt,
    analysis: parsedAnalysis,
  };
}

function stringArray(value: Prisma.JsonValue): readonly string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string')
    : [];
}

function factors(value: Prisma.JsonValue): readonly MarketBriefFactor[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (typeof item !== 'object' || item === null || Array.isArray(item)) return [];
    const candidate = item as Record<string, Prisma.JsonValue>;
    return typeof candidate.text === 'string'
      ? [{ text: candidate.text, evidenceIds: stringArray(candidate.evidenceIds ?? []) }]
      : [];
  });
}

type BriefWithEvidence = Prisma.MarketBriefGetPayload<{
  include: { evidence: { include: { article: true } } };
}>;

function toBrief(record: BriefWithEvidence): MarketBrief {
  const evidence = record.evidence.map((item) => toArticle(item.article));
  return {
    id: record.id,
    generatedAt: record.generatedAt,
    windowStart: record.windowStart,
    windowEnd: record.windowEnd,
    stance: record.stance,
    confidence: record.confidence.toNumber(),
    summary: record.summary,
    bullishFactors: factors(record.bullishFactors),
    bearishFactors: factors(record.bearishFactors),
    riskFlags: stringArray(record.riskFlags),
    unknowns: stringArray(record.unknowns),
    evidenceIds: evidence.map((article) => article.id),
    provider: record.provider,
    model: record.model,
    promptVersion: record.promptVersion,
    responseId: record.responseId,
    expiresAt: record.expiresAt,
    isStale: record.expiresAt <= new Date(),
    evidence,
  };
}

@Injectable()
export class PrismaNewsRepository implements NewsRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async saveArticles(articles: readonly NormalizedNewsArticle[]): Promise<number> {
    if (articles.length === 0) return 0;

    const result = await this.prisma.newsArticle.createMany({
      data: articles.map((article) => ({
        source: article.source,
        externalId: article.externalId,
        canonicalUrl: article.canonicalUrl,
        urlHash: article.urlHash,
        title: article.title,
        excerpt: article.excerpt,
        sourceTier: article.sourceTier,
        publishedAt: article.publishedAt,
        fetchedAt: article.fetchedAt,
        rawHash: article.rawHash,
      })),
      skipDuplicates: true,
    });
    return result.count;
  }

  async findArticles(query: FindNewsQuery): Promise<readonly NewsArticle[]> {
    const records = await this.prisma.newsArticle.findMany({
      where: query.source ? { source: query.source } : undefined,
      orderBy: [{ publishedAt: 'desc' }, { fetchedAt: 'desc' }],
      take: query.limit,
    });

    return records.map(toArticle);
  }

  async findArticleById(id: string): Promise<NewsArticle | null> {
    const record = await this.prisma.newsArticle.findUnique({
      where: { id },
    });
    return record ? toArticle(record) : null;
  }

  async findAnalysisCandidates(since: Date, limit: number): Promise<readonly NewsArticle[]> {
    const records = await this.prisma.newsArticle.findMany({
      where: { publishedAt: { gte: since } },
      orderBy: [{ publishedAt: 'desc' }, { fetchedAt: 'desc' }],
      take: limit,
    });
    return records.map(toArticle);
  }

  async saveArticleAnalysis(id: string, analysis: ArticleAnalysis): Promise<NewsArticle> {
    const record = await this.prisma.newsArticle.update({
      where: { id },
      data: {
        analysis: JSON.parse(JSON.stringify(analysis)) as Prisma.InputJsonObject,
      },
    });
    return toArticle(record);
  }

  async findLatestBrief(): Promise<MarketBrief | null> {
    const record = await this.prisma.marketBrief.findFirst({
      include: { evidence: { include: { article: true } } },
      orderBy: { generatedAt: 'desc' },
    });
    return record ? toBrief(record) : null;
  }

  async saveBrief(input: {
    analysis: MarketBriefAnalysis;
    confidence: number;
    windowStart: Date;
    windowEnd: Date;
    expiresAt: Date;
    evidenceIds: readonly string[];
  }): Promise<MarketBrief> {
    const record = await this.prisma.marketBrief.create({
      data: {
        stance: input.analysis.stance,
        confidence: input.confidence,
        summary: input.analysis.summary,
        bullishFactors: input.analysis.bullishFactors as unknown as Prisma.InputJsonValue,
        bearishFactors: input.analysis.bearishFactors as unknown as Prisma.InputJsonValue,
        riskFlags: input.analysis.riskFlags,
        unknowns: input.analysis.unknowns,
        provider: input.analysis.provider,
        model: input.analysis.model,
        promptVersion: input.analysis.promptVersion,
        responseId: input.analysis.responseId,
        windowStart: input.windowStart,
        windowEnd: input.windowEnd,
        expiresAt: input.expiresAt,
        evidence: {
          create: input.evidenceIds.map((articleId) => ({ articleId })),
        },
      },
      include: { evidence: { include: { article: true } } },
    });
    return toBrief(record);
  }
}

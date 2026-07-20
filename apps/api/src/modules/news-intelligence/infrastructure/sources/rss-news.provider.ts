import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import type { AppEnvironment } from '../../../../config/environment.schema';
import type { NewsProviderPort } from '../../domain/news-provider.port';
import type {
  FetchNewsResult,
  NewsSourceTier,
  NormalizedNewsArticle,
} from '../../domain/news.types';
import {
  normalizeFinnomenaGoldSpotReference,
  normalizeFinnomenaThaiGoldReference,
} from './finnomena-market-reference.normalizer';
import { normalizeRssOrAtomFeed } from './rss-news.normalizer';

const ALLOWED_SOURCE_DOMAINS = [
  'federalreserve.gov',
  'treasury.gov',
  'bls.gov',
  'bea.gov',
  'cftc.gov',
  'bot.or.th',
  'ecb.europa.eu',
  'intergold.co.th',
  'finnomena.com',
] as const;

function wait(delayMs: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, delayMs));
}

function isAllowedDomain(hostname: string): boolean {
  const normalized = hostname.toLowerCase();
  return ALLOWED_SOURCE_DOMAINS.some(
    (domain) => normalized === domain || normalized.endsWith(`.${domain}`),
  );
}

function validatedUrl(value: string): URL {
  const url = new URL(value);
  if (url.protocol !== 'https:' || !isAllowedDomain(url.hostname) || url.username || url.password) {
    throw new Error(`News source is not allowed: ${url.hostname}`);
  }
  return url;
}

function sourceName(url: URL): string {
  return url.hostname.replace(/^www\./, '').toUpperCase();
}

function sourceTier(url: URL): NewsSourceTier {
  const hostname = url.hostname.toLowerCase();
  return hostname === 'intergold.co.th' ||
    hostname.endsWith('.intergold.co.th') ||
    hostname === 'finnomena.com' ||
    hostname.endsWith('.finnomena.com')
    ? 'SECONDARY'
    : 'PRIMARY';
}

function requiredCategory(url: URL): string | undefined {
  const hostname = url.hostname.toLowerCase();
  return hostname === 'intergold.co.th' || hostname.endsWith('.intergold.co.th')
    ? 'บทวิเคราะห์ราคาทองคำ'
    : undefined;
}

function normalizeSource(
  url: URL,
  body: string,
  fetchedAt: Date,
): readonly NormalizedNewsArticle[] {
  if (url.pathname === '/fn3/api/gold/trader/present') {
    return normalizeFinnomenaThaiGoldReference(JSON.parse(body) as unknown, fetchedAt);
  }
  if (url.pathname === '/fn3/api/v2/gold/spot/historical/C:XAUUSD/prev') {
    return normalizeFinnomenaGoldSpotReference(JSON.parse(body) as unknown, fetchedAt);
  }
  return normalizeRssOrAtomFeed(
    body,
    sourceName(url),
    fetchedAt,
    sourceTier(url),
    requiredCategory(url),
  );
}

async function readLimitedText(response: Response, maxBytes: number): Promise<string> {
  const declaredLength = Number(response.headers.get('content-length') ?? 0);
  if (declaredLength > maxBytes) throw new Error('News feed exceeds configured size limit');
  if (!response.body) return '';

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let received = 0;
  let result = '';

  while (true) {
    const chunk = await reader.read();
    if (chunk.done) break;
    received += chunk.value.byteLength;
    if (received > maxBytes) {
      await reader.cancel();
      throw new Error('News feed exceeds configured size limit');
    }
    result += decoder.decode(chunk.value, { stream: true });
  }

  return result + decoder.decode();
}

@Injectable()
export class RssNewsProvider implements NewsProviderPort {
  private readonly sourceUrls: readonly URL[];
  private readonly timeoutMs: number;
  private readonly maxRetries: number;
  private readonly retryBaseDelayMs: number;
  private readonly maxFeedBytes: number;

  constructor(
    @Inject(ConfigService)
    config: ConfigService<AppEnvironment, true>,
  ) {
    this.sourceUrls = config.get('news.sourceUrls', { infer: true }).map(validatedUrl);
    this.timeoutMs = config.get('news.requestTimeoutMs', { infer: true });
    this.maxRetries = config.get('news.requestMaxRetries', { infer: true });
    this.retryBaseDelayMs = config.get('news.retryBaseDelayMs', { infer: true });
    this.maxFeedBytes = config.get('news.maxFeedBytes', { infer: true });
  }

  async fetchLatest(): Promise<FetchNewsResult> {
    const results = await Promise.allSettled(
      this.sourceUrls.map(async (url) => {
        const fetchedAt = new Date();
        const body = await this.requestSource(url);
        return normalizeSource(url, body, fetchedAt);
      }),
    );
    const articles: NormalizedNewsArticle[] = [];
    const errors: string[] = [];

    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        articles.push(...result.value);
      } else {
        const url = this.sourceUrls[index];
        const source = url ? sourceName(url) : 'UNKNOWN';
        const message =
          result.reason instanceof Error ? result.reason.message : 'Unknown news source error';
        errors.push(`${source}: ${message}`);
      }
    });

    return {
      articles,
      sourcesAttempted: results.length,
      sourcesSucceeded: results.filter((result) => result.status === 'fulfilled').length,
      errors,
    };
  }

  private async requestSource(url: URL): Promise<string> {
    let lastError: unknown;

    for (let attempt = 0; attempt <= this.maxRetries; attempt += 1) {
      try {
        const response = await fetch(url, {
          headers: {
            accept:
              'application/json, application/atom+xml, application/rss+xml, application/xml, text/xml',
            'user-agent': 'GoldIQ/0.1 news-research',
          },
          redirect: 'error',
          signal: AbortSignal.timeout(this.timeoutMs),
        });
        if (!response.ok) throw new Error(`Research source request failed with ${response.status}`);
        return await readLimitedText(response, this.maxFeedBytes);
      } catch (error: unknown) {
        lastError = error;
        if (attempt < this.maxRetries) await wait(this.retryBaseDelayMs * 2 ** attempt);
      }
    }

    const message = lastError instanceof Error ? lastError.message : 'Unknown provider error';
    throw new Error(`Unable to fetch research source: ${message}`);
  }
}

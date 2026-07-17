import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import type { AppEnvironment } from '../../../../config/environment.schema';
import type { GoldPriceProviderPort } from '../../domain/gold-price-provider.port';
import type { NormalizedGoldPriceQuote } from '../../domain/gold-price.types';
import { normalizeHuaSengHengResponses } from './hua-seng-heng.normalizer';

function wait(delayMs: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, delayMs);
  });
}

@Injectable()
export class HuaSengHengPriceProvider implements GoldPriceProviderPort {
  private readonly price965Url: string;
  private readonly price9999Url: string;
  private readonly apiToken: string | undefined;
  private readonly timeoutMs: number;
  private readonly maxRetries: number;
  private readonly retryBaseDelayMs: number;

  constructor(
    @Inject(ConfigService)
    config: ConfigService<AppEnvironment, true>,
  ) {
    this.price965Url = config.get('hsh.price965Url', { infer: true });
    this.price9999Url = config.get('hsh.price9999Url', { infer: true });
    this.apiToken = config.get('hsh.apiToken', { infer: true });
    this.timeoutMs = config.get('hsh.requestTimeoutMs', { infer: true });
    this.maxRetries = config.get('hsh.requestMaxRetries', { infer: true });
    this.retryBaseDelayMs = config.get('hsh.retryBaseDelayMs', {
      infer: true,
    });
  }

  async fetchCurrentPrices(): Promise<readonly NormalizedGoldPriceQuote[]> {
    const [raw965, raw9999] = await Promise.all([
      this.requestJson(this.price965Url),
      this.requestJson(this.price9999Url),
    ]);

    return normalizeHuaSengHengResponses(raw965, raw9999);
  }

  private async requestJson(url: string): Promise<unknown> {
    let lastError: unknown;

    for (let attempt = 0; attempt <= this.maxRetries; attempt += 1) {
      try {
        const headers = this.apiToken ? { authorization: `Bearer ${this.apiToken}` } : undefined;
        const response = await fetch(url, {
          headers,
          signal: AbortSignal.timeout(this.timeoutMs),
        });

        if (!response.ok) {
          throw new Error(`Hua Seng Heng request failed with ${response.status}`);
        }

        return (await response.json()) as unknown;
      } catch (error: unknown) {
        lastError = error;
        if (attempt < this.maxRetries) {
          await wait(this.retryBaseDelayMs * 2 ** attempt);
        }
      }
    }

    const message = lastError instanceof Error ? lastError.message : 'Unknown provider error';
    throw new Error(`Unable to fetch Hua Seng Heng prices: ${message}`);
  }
}

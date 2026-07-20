import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import type { AppEnvironment } from '../../../config/environment.schema';
import { NEWS_REPOSITORY_PORT, type NewsRepositoryPort } from '../domain/news-repository.port';

export interface NewsAgentStatus {
  readonly newsScheduler: {
    readonly enabled: boolean;
    readonly cron: string;
    readonly lockTtlMs: number;
  };
  readonly researchAgentScheduler: {
    readonly enabled: boolean;
    readonly cron: string;
    readonly lockTtlMs: number;
  };
  readonly provider: {
    readonly activeProvider: 'openai' | 'ollama';
    readonly model: string;
    readonly ollamaBaseUrl: string;
    readonly ollamaStatus: 'UP' | 'DOWN';
    readonly ollamaLatencyMs: number | null;
    readonly ollamaVersion: string | null;
    readonly ollamaMessage?: string;
    readonly openAiConfigured: boolean;
  };
  readonly latestBrief: {
    readonly status: 'AVAILABLE' | 'UNAVAILABLE';
    readonly id?: string;
    readonly generatedAt?: Date;
    readonly expiresAt?: Date;
    readonly stance?: 'BULLISH' | 'NEUTRAL' | 'BEARISH';
    readonly confidence?: number;
    readonly isStale?: boolean;
  };
}

@Injectable()
export class GetNewsAgentStatusService {
  constructor(
    @Inject(ConfigService)
    private readonly config: ConfigService<AppEnvironment, true>,
    @Inject(NEWS_REPOSITORY_PORT)
    private readonly repository: NewsRepositoryPort,
  ) {}

  async execute(): Promise<NewsAgentStatus> {
    const newsConfig = this.config.get('news', { infer: true });
    const agentConfig = this.config.get('researchAgent', { infer: true });

    const latestBrief = await this.repository.findLatestBrief();
    const now = new Date();

    const ollamaPing = await this.pingOllama(agentConfig.ollamaBaseUrl);

    return {
      newsScheduler: {
        enabled: newsConfig.enabled,
        cron: newsConfig.refreshCron,
        lockTtlMs: newsConfig.refreshLockTtlMs,
      },
      researchAgentScheduler: {
        enabled: agentConfig.enabled,
        cron: agentConfig.cron,
        lockTtlMs: agentConfig.lockTtlMs,
      },
      provider: {
        activeProvider: agentConfig.provider,
        model: agentConfig.model,
        ollamaBaseUrl: agentConfig.ollamaBaseUrl,
        ollamaStatus: ollamaPing.status,
        ollamaLatencyMs: ollamaPing.latencyMs,
        ollamaVersion: ollamaPing.version,
        ollamaMessage: ollamaPing.message,
        openAiConfigured: Boolean(agentConfig.openAiApiKey && agentConfig.openAiApiKey.length > 0),
      },
      latestBrief: latestBrief
        ? {
            status: 'AVAILABLE',
            id: latestBrief.id,
            generatedAt: latestBrief.generatedAt,
            expiresAt: latestBrief.expiresAt,
            stance: latestBrief.stance,
            confidence: latestBrief.confidence,
            isStale: latestBrief.expiresAt < now,
          }
        : {
            status: 'UNAVAILABLE',
          },
    };
  }

  private async pingOllama(baseUrl: string): Promise<{
    status: 'UP' | 'DOWN';
    latencyMs: number | null;
    version: string | null;
    message?: string;
  }> {
    const cleanUrl = baseUrl.replace(/\/+$/, '');
    const startedAt = performance.now();

    try {
      const response = await fetch(`${cleanUrl}/api/version`, {
        method: 'GET',
        signal: AbortSignal.timeout(2_000),
      });

      const latencyMs = Math.round(performance.now() - startedAt);

      if (!response.ok) {
        return {
          status: 'DOWN',
          latencyMs,
          version: null,
          message: `Ollama returned HTTP ${response.status}`,
        };
      }

      const body = (await response.json()) as { version?: string };
      return {
        status: 'UP',
        latencyMs,
        version: body.version ?? 'unknown',
      };
    } catch (error: unknown) {
      const latencyMs = Math.round(performance.now() - startedAt);
      const message = error instanceof Error ? error.message : 'Connection failed';
      return {
        status: 'DOWN',
        latencyMs,
        version: null,
        message,
      };
    }
  }
}

import { describe, expect, it, vi, beforeEach } from 'vitest';
import type { ConfigService } from '@nestjs/config';

import type { AppEnvironment } from '../../../config/environment.schema';
import type { NewsRepositoryPort } from '../domain/news-repository.port';
import { GetNewsAgentStatusService } from './get-news-agent-status.service';

describe('GetNewsAgentStatusService', () => {
  let service: GetNewsAgentStatusService;
  let mockConfig: ConfigService<AppEnvironment, true>;
  let mockRepository: NewsRepositoryPort;

  beforeEach(() => {
    mockConfig = {
      get: vi.fn((key: string) => {
        if (key === 'news') {
          return {
            enabled: true,
            refreshCron: '0 */15 * * * *',
            refreshLockTtlMs: 120_000,
          };
        }
        if (key === 'researchAgent') {
          return {
            enabled: true,
            cron: '0 5 * * * *',
            lockTtlMs: 120_000,
            provider: 'ollama',
            model: 'qwen2.5-coder:latest',
            ollamaBaseUrl: 'http://localhost:11434',
            openAiApiKey: '',
          };
        }
        return null;
      }),
    } as unknown as ConfigService<AppEnvironment, true>;

    mockRepository = {
      saveArticles: vi.fn(),
      findArticles: vi.fn(),
      findArticleById: vi.fn(),
      findAnalysisCandidates: vi.fn(),
      saveArticleAnalysis: vi.fn(),
      saveBrief: vi.fn(),
      findLatestBrief: vi.fn().mockResolvedValue(null),
    };

    service = new GetNewsAgentStatusService(mockConfig, mockRepository);
  });

  it('returns scheduler and provider status when brief is unavailable', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(() =>
      Promise.resolve(
        new Response(JSON.stringify({ version: '0.5.1' }), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        }),
      ),
    );

    const status = await service.execute();

    expect(status.newsScheduler).toEqual({
      enabled: true,
      cron: '0 */15 * * * *',
      lockTtlMs: 120_000,
    });
    expect(status.researchAgentScheduler).toEqual({
      enabled: true,
      cron: '0 5 * * * *',
      lockTtlMs: 120_000,
    });
    expect(status.provider.activeProvider).toBe('ollama');
    expect(status.provider.model).toBe('qwen2.5-coder:latest');
    expect(status.provider.ollamaStatus).toBe('UP');
    expect(status.provider.ollamaVersion).toBe('0.5.1');
    expect(status.latestBrief.status).toBe('UNAVAILABLE');
  });

  it('handles Ollama server connection failure gracefully', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(() =>
      Promise.reject(new Error('Connection refused')),
    );

    const status = await service.execute();

    expect(status.provider.ollamaStatus).toBe('DOWN');
    expect(status.provider.ollamaMessage).toBe('Connection refused');
  });
});

import type { ConfigService } from '@nestjs/config';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { AppEnvironment } from '../../../../config/environment.schema';
import type { NewsArticle } from '../../domain/news.types';
import { OllamaNewsAnalyzerAdapter } from './ollama-news-analyzer.adapter';

const article: NewsArticle = {
  id: 'news-1',
  source: 'FEDERALRESERVE.GOV',
  canonicalUrl: 'https://www.federalreserve.gov/news/one',
  title: 'Policy update',
  excerpt: 'Policy remained unchanged.',
  sourceTier: 'PRIMARY',
  publishedAt: new Date('2026-07-19T09:00:00Z'),
  fetchedAt: new Date('2026-07-19T09:05:00Z'),
};

function config(): ConfigService<AppEnvironment, true> {
  const values: Record<string, unknown> = {
    'researchAgent.ollamaBaseUrl': 'http://localhost:11434/',
    'researchAgent.model': 'qwen3:14b',
    'researchAgent.promptVersion': 'test-v1',
    'researchAgent.timeoutMs': 10_000,
  };
  return {
    get: vi.fn((key: string) => values[key]),
  } as unknown as ConfigService<AppEnvironment, true>;
}

describe('OllamaNewsAnalyzerAdapter', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('requests a structured local analysis and validates the response', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          model: 'qwen3:14b',
          message: {
            role: 'assistant',
            content: JSON.stringify({
              stance: 'NEUTRAL',
              summary: 'Evidence is mixed.',
              bullishFactors: [{ text: 'Supportive factor', evidenceIds: ['news-1'] }],
              bearishFactors: [],
              riskFlags: [],
              unknowns: [],
              evidenceIds: ['news-1'],
            }),
          },
        }),
        { status: 200, headers: { 'content-type': 'application/json' } },
      ),
    );
    vi.stubGlobal('fetch', fetchMock);

    const result = await new OllamaNewsAnalyzerAdapter(config()).analyze([article]);

    expect(result).toMatchObject({
      provider: 'OLLAMA',
      model: 'qwen3:14b',
      promptVersion: 'test-v1',
      responseId: null,
      stance: 'NEUTRAL',
      evidenceIds: ['news-1'],
    });
    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:11434/api/chat',
      expect.objectContaining({ method: 'POST' }),
    );
    const request = fetchMock.mock.calls[0]?.[1] as RequestInit;
    expect(typeof request.body).toBe('string');
    const body = JSON.parse(request.body as string) as {
      stream: boolean;
      think: boolean;
      format: { type: string; properties: Record<string, Record<string, unknown>> };
      messages: Array<{ content: string }>;
    };
    expect(body).toMatchObject({
      stream: false,
      think: false,
      format: {
        type: 'object',
      },
    });
    expect(body.format.properties).toHaveProperty('stance');
    expect(body.format.properties.summary).not.toHaveProperty('maxLength');
    expect(body.messages[1]?.content).toContain('เป็นภาษาไทยเท่านั้น');
  });
});

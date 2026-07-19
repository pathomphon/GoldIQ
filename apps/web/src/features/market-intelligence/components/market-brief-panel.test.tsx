import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { MarketBriefPanel } from './market-brief-panel';

describe('MarketBriefPanel', () => {
  it('renders grounded factors, confidence, and source links', () => {
    render(
      <MarketBriefPanel
        result={{
          error: null,
          data: {
            id: 'brief-1',
            generatedAt: '2026-07-19T10:00:00Z',
            stance: 'NEUTRAL',
            confidence: 0.45,
            summary: 'หลักฐานยังมีเพียงแหล่งเดียว',
            bullishFactors: [{ text: 'นโยบายมีทิศทางผ่อนคลาย', evidenceIds: ['news-1'] }],
            bearishFactors: [],
            riskFlags: [],
            unknowns: [],
            expiresAt: '2026-07-19T11:00:00Z',
            isStale: false,
            evidence: [
              {
                id: 'news-1',
                source: 'FEDERALRESERVE.GOV',
                canonicalUrl: 'https://www.federalreserve.gov/news/one',
                title: 'Policy update',
                publishedAt: '2026-07-19T09:00:00Z',
              },
            ],
          },
        }}
      />,
    );

    expect(screen.getByText('Data confidence 45%')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Policy update' })).toHaveAttribute(
      'href',
      'https://www.federalreserve.gov/news/one',
    );
  });
});

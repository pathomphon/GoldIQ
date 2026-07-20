import { describe, expect, it } from 'vitest';

import { applyMarketBriefShadow } from './market-brief-shadow';
import type {
  MarketBriefSignal,
  Recommendation,
  RecommendationAction,
} from './recommendation.types';

function recommendation(action: RecommendationAction): Recommendation {
  return {
    action,
    why: 'Price-and-risk rule',
    confidence: 80,
    risk: 'Test risk',
    evidence: {
      technical: { summary: 'Tech' },
      portfolio: {
        summary: 'Port',
        drawdownPercent: 0,
        positionSizePercent: 20,
        averageCostVsPricePercent: 0,
      },
      news: { summary: 'News', stance: 'UNKNOWN', confidence: 0 },
    },
    reasons: ['Price-and-risk rule'],
    recommendedAmount: action === 'BUY' ? 10_000 : 0,
    sellPartialPercent: action === 'SELL' ? 25 : null,
    allocation: {
      availableCash: 50_000,
      reservedCash: 10_000,
      deployableCash: 25_000,
    },
    market: {
      observedAt: new Date('2026-07-19T10:00:00Z'),
      currentBuyPrice: 63_000,
      currentSellPrice: 63_100,
      totalInvested: 20_000,
      totalGoldWeight: 0.316,
      averageCost: 63_291,
      currentValue: 19_908,
      profitLossPercentage: -0.46,
      nextBuyLevel: null,
    },
    settings: {
      riskProfile: 'BALANCED',
      availableCash: 50_000,
      minimumCashReserve: 10_000,
      maxAllocationPercent: 50,
      profitTargetPercent: 5,
      sellPartialPercent: 25,
      stopBuyAbovePrice: null,
    },
  };
}

function brief(overrides: Partial<MarketBriefSignal> = {}): MarketBriefSignal {
  return {
    id: 'brief-1',
    generatedAt: new Date('2026-07-19T10:05:00Z'),
    stance: 'NEUTRAL',
    confidence: 0.75,
    isStale: false,
    ...overrides,
  };
}

const settings = { enabled: true, minimumConfidence: 0.4 };

describe('applyMarketBriefShadow', () => {
  it('shows a conservative BUY to WAIT downgrade without changing the live action', () => {
    const result = applyMarketBriefShadow(
      recommendation('BUY'),
      brief({ stance: 'BEARISH' }),
      settings,
    );

    expect(result.action).toBe('BUY');
    expect(result.marketIntelligence).toMatchObject({
      status: 'ACTIVE',
      effect: 'CAUTION',
      baseAction: 'BUY',
      shadowAction: 'WAIT',
    });
  });

  it('never promotes WAIT to BUY from bullish news', () => {
    const result = applyMarketBriefShadow(
      recommendation('WAIT'),
      brief({ stance: 'BULLISH' }),
      settings,
    );

    expect(result.action).toBe('WAIT');
    expect(result.marketIntelligence?.shadowAction).toBe('WAIT');
  });

  it('ignores stale or low-confidence briefs', () => {
    expect(
      applyMarketBriefShadow(recommendation('BUY'), brief({ isStale: true }), settings)
        .marketIntelligence?.status,
    ).toBe('STALE');
    expect(
      applyMarketBriefShadow(recommendation('BUY'), brief({ confidence: 0.2 }), settings)
        .marketIntelligence?.status,
    ).toBe('LOW_CONFIDENCE');
  });

  it('cannot override a hard-risk sell action', () => {
    const result = applyMarketBriefShadow(
      recommendation('SELL'),
      brief({ stance: 'BULLISH' }),
      settings,
    );

    expect(result.action).toBe('SELL');
    expect(result.marketIntelligence?.shadowAction).toBe('SELL');
    expect(result.marketIntelligence?.effect).toBe('NO_CHANGE');
  });

  it('overrides BUY to WAIT in LIVE mode when brief is bearish', () => {
    const liveSettings = { enabled: true, mode: 'LIVE' as const, minimumConfidence: 0.4 };
    const result = applyMarketBriefShadow(
      recommendation('BUY'),
      brief({ stance: 'BEARISH' }),
      liveSettings,
    );

    expect(result.action).toBe('WAIT');
    expect(result.marketIntelligence).toMatchObject({
      mode: 'LIVE',
      status: 'ACTIVE',
      effect: 'LIVE_OVERRIDE_WAIT',
      baseAction: 'BUY',
      shadowAction: 'WAIT',
      liveAction: 'WAIT',
    });
    expect(result.reasons).toContain(
      'Bearish market intelligence conservatively deferred this BUY action to WAIT in live mode.',
    );
  });
});

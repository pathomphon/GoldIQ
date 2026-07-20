import type {
  MarketBriefSignal,
  Recommendation,
  RecommendationMarketIntelligence,
} from './recommendation.types';

interface ShadowModeSettings {
  readonly enabled: boolean;
  readonly minimumConfidence: number;
}

function inactiveResult(
  recommendation: Recommendation,
  status: RecommendationMarketIntelligence['status'],
  reason: string,
  brief: MarketBriefSignal | null,
): Recommendation {
  return {
    ...recommendation,
    marketIntelligence: {
      mode: 'SHADOW',
      enabled: status !== 'DISABLED',
      status,
      effect: 'NO_CHANGE',
      baseAction: recommendation.action,
      shadowAction: recommendation.action,
      reasons: [reason],
      brief,
    },
  };
}

export function applyMarketBriefShadow(
  recommendation: Recommendation,
  brief: MarketBriefSignal | null,
  settings: ShadowModeSettings,
): Recommendation {
  if (!settings.enabled) {
    return inactiveResult(
      recommendation,
      'DISABLED',
      'Market brief shadow mode is disabled.',
      null,
    );
  }
  if (!brief) {
    return inactiveResult(
      recommendation,
      'UNAVAILABLE',
      'No market brief is available for shadow evaluation.',
      null,
    );
  }
  if (brief.isStale) {
    return inactiveResult(
      recommendation,
      'STALE',
      'The latest market brief is stale and cannot influence the shadow signal.',
      brief,
    );
  }
  if (brief.confidence < settings.minimumConfidence) {
    return inactiveResult(
      recommendation,
      'LOW_CONFIDENCE',
      `Market brief confidence is below the ${(settings.minimumConfidence * 100).toFixed(0)}% threshold.`,
      brief,
    );
  }

  let effect: RecommendationMarketIntelligence['effect'] = 'NO_CHANGE';
  let shadowAction = recommendation.action;
  let reason = 'The market brief is neutral, so the shadow signal leaves the action unchanged.';

  if (recommendation.action === 'BUY' && brief.stance === 'BEARISH') {
    effect = 'CAUTION';
    shadowAction = 'WAIT';
    reason =
      'Bearish evidence would conservatively defer this BUY in shadow mode, without changing the live action.';
  } else if (recommendation.action === 'BUY' && brief.stance === 'BULLISH') {
    effect = 'SUPPORTS';
    reason = 'Bullish evidence supports the price-and-risk-based BUY action.';
  } else if (
    recommendation.action === 'SELL_PARTIAL' ||
    recommendation.action === 'REVIEW_PROFIT'
  ) {
    reason =
      'Portfolio profit and hard-risk rules take precedence; news cannot create or override a sell action.';
  } else if (
    (recommendation.action === 'WAIT' || recommendation.action === 'HOLD') &&
    brief.stance === 'BEARISH'
  ) {
    effect = 'SUPPORTS';
    reason = 'Bearish evidence supports keeping the conservative WAIT/HOLD action.';
  } else if (
    (recommendation.action === 'WAIT' || recommendation.action === 'HOLD') &&
    brief.stance === 'BULLISH'
  ) {
    reason =
      'Bullish evidence is visible for context, but shadow mode cannot promote WAIT/HOLD into BUY.';
  }

  return {
    ...recommendation,
    marketIntelligence: {
      mode: 'SHADOW',
      enabled: true,
      status: 'ACTIVE',
      effect,
      baseAction: recommendation.action,
      shadowAction,
      reasons: [reason],
      brief,
    },
  };
}

import type {
  MarketBriefSignal,
  Recommendation,
  RecommendationMarketIntelligence,
} from './recommendation.types';

interface MarketBriefSettings {
  readonly enabled: boolean;
  readonly mode?: 'SHADOW' | 'LIVE';
  readonly minimumConfidence: number;
}

function inactiveResult(
  recommendation: Recommendation,
  status: RecommendationMarketIntelligence['status'],
  reason: string,
  brief: MarketBriefSignal | null,
  mode: 'SHADOW' | 'LIVE' = 'SHADOW',
): Recommendation {
  return {
    ...recommendation,
    marketIntelligence: {
      mode,
      enabled: status !== 'DISABLED',
      status,
      effect: 'NO_CHANGE',
      baseAction: recommendation.action,
      shadowAction: recommendation.action,
      liveAction: recommendation.action,
      reasons: [reason],
      brief,
    },
  };
}

export function applyMarketBriefShadow(
  recommendation: Recommendation,
  brief: MarketBriefSignal | null,
  settings: MarketBriefSettings,
): Recommendation {
  const mode = settings.mode ?? 'SHADOW';

  if (!settings.enabled) {
    return inactiveResult(
      recommendation,
      'DISABLED',
      'Market brief intelligence is disabled.',
      null,
      mode,
    );
  }
  if (!brief) {
    return inactiveResult(
      recommendation,
      'UNAVAILABLE',
      'No market brief is available for evaluation.',
      null,
      mode,
    );
  }
  if (brief.isStale) {
    return inactiveResult(
      recommendation,
      'STALE',
      'The latest market brief is stale and cannot influence the signal.',
      brief,
      mode,
    );
  }
  if (brief.confidence < settings.minimumConfidence) {
    return inactiveResult(
      recommendation,
      'LOW_CONFIDENCE',
      `Market brief confidence is below the ${(settings.minimumConfidence * 100).toFixed(0)}% threshold.`,
      brief,
      mode,
    );
  }

  let effect: RecommendationMarketIntelligence['effect'] = 'NO_CHANGE';
  let shadowAction = recommendation.action;
  let liveAction = recommendation.action;
  let reason = 'The market brief is neutral, so the signal leaves the action unchanged.';

  if (
    (recommendation.action === 'BUY' || recommendation.action === 'STRONG_BUY') &&
    brief.stance === 'BEARISH'
  ) {
    shadowAction = 'WAIT';
    if (mode === 'LIVE') {
      effect = 'LIVE_OVERRIDE_WAIT';
      liveAction = 'WAIT';
      reason =
        'Bearish market intelligence conservatively deferred this BUY action to WAIT in live mode.';
    } else {
      effect = 'CAUTION';
      reason =
        'Bearish evidence would conservatively defer this BUY in shadow mode, without changing the live action.';
    }
  } else if (
    (recommendation.action === 'BUY' || recommendation.action === 'STRONG_BUY') &&
    brief.stance === 'BULLISH'
  ) {
    effect = 'SUPPORTS';
    reason = 'Bullish evidence supports the price-and-risk-based BUY action.';
  } else if (recommendation.action === 'SELL' || recommendation.action === 'STRONG_SELL') {
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
      mode === 'LIVE'
        ? 'Bullish evidence is visible for context, but live mode cannot promote WAIT/HOLD into BUY.'
        : 'Bullish evidence is visible for context, but shadow mode cannot promote WAIT/HOLD into BUY.';
  }

  return {
    ...recommendation,
    action: liveAction,
    reasons:
      mode === 'LIVE' && liveAction !== recommendation.action
        ? [...recommendation.reasons, reason]
        : recommendation.reasons,
    marketIntelligence: {
      mode,
      enabled: true,
      status: 'ACTIVE',
      effect,
      baseAction: recommendation.action,
      shadowAction,
      liveAction,
      reasons: [reason],
      brief,
    },
  };
}

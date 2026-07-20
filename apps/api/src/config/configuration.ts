import type { AppEnvironment } from './environment.schema';

function commaSeparated(value: string | undefined, fallback: string): string[] {
  return (value ?? fallback)
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);
}

export function configuration(): AppEnvironment {
  return {
    nodeEnv:
      process.env.NODE_ENV === 'production'
        ? 'production'
        : process.env.NODE_ENV === 'test'
          ? 'test'
          : 'development',
    logLevel: (process.env.LOG_LEVEL as AppEnvironment['logLevel'] | undefined) ?? 'info',
    api: {
      port: Number(process.env.API_PORT ?? 4000),
      host: process.env.API_HOST ?? '0.0.0.0',
      corsOrigins: commaSeparated(process.env.API_CORS_ORIGINS, 'http://localhost:3000'),
      rateLimit: {
        ttlMs: Number(process.env.API_RATE_LIMIT_TTL_MS ?? 60_000),
        max: Number(process.env.API_RATE_LIMIT_MAX ?? 120),
      },
    },
    database: {
      url:
        process.env.DATABASE_URL ??
        'postgresql://goldiq:goldiq@localhost:5432/goldiq?schema=public',
    },
    redis: {
      url: process.env.REDIS_URL ?? 'redis://localhost:6379',
    },
    hsh: {
      price965Url: process.env.HSH_PRICE_965_URL ?? 'http://localhost:4010/api/values/getprice/',
      price9999Url: process.env.HSH_PRICE_9999_URL ?? 'http://localhost:4010/api/values',
      apiToken: process.env.HSH_API_TOKEN,
      requestTimeoutMs: Number(process.env.HSH_REQUEST_TIMEOUT_MS ?? 5_000),
      requestMaxRetries: Number(process.env.HSH_REQUEST_MAX_RETRIES ?? 3),
      retryBaseDelayMs: Number(process.env.HSH_RETRY_BASE_DELAY_MS ?? 250),
      pollCron: process.env.HSH_POLL_CRON ?? '*/1 * * * *',
      schedulerEnabled: process.env.HSH_SCHEDULER_ENABLED !== 'false',
      refreshLockTtlMs: Number(process.env.GOLD_PRICE_REFRESH_LOCK_TTL_MS ?? 50_000),
    },
    goldPriceHistory: {
      defaultLimit: Number(process.env.GOLD_PRICE_HISTORY_DEFAULT_LIMIT ?? 100),
      maxLimit: Number(process.env.GOLD_PRICE_HISTORY_MAX_LIMIT ?? 500),
    },
    buyPlanAlerts: {
      cron: process.env.BUY_PLAN_ALERT_CRON ?? '*/30 * * * * *',
      enabled: process.env.BUY_PLAN_ALERTS_ENABLED !== 'false',
      lockTtlMs: Number(process.env.BUY_PLAN_ALERT_LOCK_TTL_MS ?? 25_000),
    },
    recommendation: {
      shadowModeEnabled: process.env.RECOMMENDATION_SHADOW_MODE_ENABLED === 'true',
      mode:
        (process.env.RECOMMENDATION_MODE as AppEnvironment['recommendation']['mode'] | undefined) ??
        'SHADOW',
      shadowMinConfidence: Number(process.env.RECOMMENDATION_SHADOW_MIN_CONFIDENCE ?? 0.4),
    },
    news: {
      enabled: process.env.NEWS_ENABLED === 'true',
      refreshCron: process.env.NEWS_REFRESH_CRON ?? '0 */15 * * * *',
      refreshLockTtlMs: Number(process.env.NEWS_REFRESH_LOCK_TTL_MS ?? 120_000),
      sourceUrls: commaSeparated(
        process.env.NEWS_SOURCE_URLS,
        [
          'https://www.federalreserve.gov/feeds/press_all.xml',
          'https://www.bls.gov/feed/cpi.rss',
          'https://www.bls.gov/feed/empsit.rss',
          'https://www.ecb.europa.eu/rss/press.html',
          'https://www.cftc.gov/RSS/RSSGP/rssgp.xml',
          'https://www.intergold.co.th/investor_core/feed/',
          'https://www.finnomena.com/feed/?tag=gold',
          'https://www.finnomena.com/fn3/api/gold/trader/present',
          'https://www.finnomena.com/fn3/api/v2/gold/spot/historical/C:XAUUSD/prev',
        ].join(','),
      ),
      requestTimeoutMs: Number(process.env.NEWS_REQUEST_TIMEOUT_MS ?? 10_000),
      requestMaxRetries: Number(process.env.NEWS_REQUEST_MAX_RETRIES ?? 2),
      retryBaseDelayMs: Number(process.env.NEWS_RETRY_BASE_DELAY_MS ?? 500),
      maxFeedBytes: Number(process.env.NEWS_MAX_FEED_BYTES ?? 1_000_000),
      defaultLimit: Number(process.env.NEWS_DEFAULT_LIMIT ?? 30),
      maxLimit: Number(process.env.NEWS_MAX_LIMIT ?? 100),
    },
    researchAgent: {
      enabled: process.env.RESEARCH_AGENT_ENABLED === 'true',
      cron: process.env.RESEARCH_AGENT_CRON ?? '0 5 * * * *',
      lockTtlMs: Number(process.env.RESEARCH_AGENT_LOCK_TTL_MS ?? 120_000),
      provider:
        (process.env.RESEARCH_AGENT_PROVIDER as AppEnvironment['researchAgent']['provider']) ??
        'openai',
      model: process.env.RESEARCH_AGENT_MODEL ?? 'gpt-5.6-luna',
      timeoutMs: Number(process.env.RESEARCH_AGENT_TIMEOUT_MS ?? 45_000),
      windowHours: Number(process.env.RESEARCH_AGENT_WINDOW_HOURS ?? 168),
      maxArticles: Number(process.env.RESEARCH_AGENT_MAX_ARTICLES ?? 40),
      briefTtlMinutes: Number(process.env.RESEARCH_AGENT_BRIEF_TTL_MINUTES ?? 60),
      promptVersion: process.env.RESEARCH_AGENT_PROMPT_VERSION ?? 'gold-research-v7-th-finnomena',
      ollamaBaseUrl: process.env.OLLAMA_BASE_URL ?? 'http://localhost:11434',
      openAiApiKey: process.env.OPENAI_API_KEY || undefined,
    },
    notifications: {
      lineAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
      lineUserId: process.env.LINE_USER_ID,
      telegramBotToken: process.env.TELEGRAM_BOT_TOKEN,
      telegramChatId: process.env.TELEGRAM_CHAT_ID,
    },
  };
}

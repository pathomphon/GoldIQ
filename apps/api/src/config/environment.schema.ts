import { z } from 'zod';

const environmentSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
  API_PORT: z.coerce.number().int().positive().max(65_535).default(4000),
  API_HOST: z.string().min(1).default('0.0.0.0'),
  API_CORS_ORIGINS: z.string().default('http://localhost:3000'),
  API_RATE_LIMIT_TTL_MS: z.coerce.number().int().positive().default(60_000),
  API_RATE_LIMIT_MAX: z.coerce.number().int().positive().default(120),
  DATABASE_URL: z
    .string()
    .url()
    .default('postgresql://goldiq:goldiq@localhost:5432/goldiq?schema=public'),
  REDIS_URL: z.string().url().default('redis://localhost:6379'),
  HSH_PRICE_965_URL: z.string().url().default('http://localhost:4010/api/values/getprice/'),
  HSH_PRICE_9999_URL: z.string().url().default('http://localhost:4010/api/values'),
  HSH_API_TOKEN: z.string().optional(),
  HSH_REQUEST_TIMEOUT_MS: z.coerce.number().int().positive().default(5_000),
  HSH_REQUEST_MAX_RETRIES: z.coerce.number().int().min(0).max(10).default(3),
  HSH_RETRY_BASE_DELAY_MS: z.coerce.number().int().positive().default(250),
  HSH_POLL_CRON: z.string().min(1).default('*/1 * * * *'),
  HSH_SCHEDULER_ENABLED: z
    .enum(['true', 'false'])
    .default('true')
    .transform((value) => value === 'true'),
  GOLD_PRICE_REFRESH_LOCK_TTL_MS: z.coerce.number().int().positive().default(50_000),
  GOLD_PRICE_HISTORY_DEFAULT_LIMIT: z.coerce.number().int().positive().default(100),
  GOLD_PRICE_HISTORY_MAX_LIMIT: z.coerce.number().int().positive().default(500),
  BUY_PLAN_ALERT_CRON: z.string().min(1).default('*/30 * * * * *'),
  BUY_PLAN_ALERTS_ENABLED: z
    .enum(['true', 'false'])
    .default('true')
    .transform((value) => value === 'true'),
  BUY_PLAN_ALERT_LOCK_TTL_MS: z.coerce.number().int().positive().default(25_000),
  LINE_CHANNEL_ACCESS_TOKEN: z.string().optional(),
  LINE_USER_ID: z.string().optional(),
  LINE_WEBHOOK_URL: z.string().url().optional().or(z.literal('')),
  TELEGRAM_BOT_TOKEN: z.string().optional(),
  TELEGRAM_CHAT_ID: z.string().optional(),
  TELEGRAM_WEBHOOK_URL: z.string().url().optional().or(z.literal('')),
});

export type RawEnvironment = z.infer<typeof environmentSchema>;

export interface AppEnvironment {
  nodeEnv: RawEnvironment['NODE_ENV'];
  logLevel: RawEnvironment['LOG_LEVEL'];
  api: {
    port: number;
    host: string;
    corsOrigins: string[];
    rateLimit: {
      ttlMs: number;
      max: number;
    };
  };
  database: {
    url: string;
  };
  redis: {
    url: string;
  };
  hsh: {
    price965Url: string;
    price9999Url: string;
    apiToken?: string;
    requestTimeoutMs: number;
    requestMaxRetries: number;
    retryBaseDelayMs: number;
    pollCron: string;
    schedulerEnabled: boolean;
    refreshLockTtlMs: number;
  };
  goldPriceHistory: {
    defaultLimit: number;
    maxLimit: number;
  };
  buyPlanAlerts: {
    cron: string;
    enabled: boolean;
    lockTtlMs: number;
  };
  notifications: {
    lineAccessToken?: string;
    lineUserId?: string;
    telegramBotToken?: string;
    telegramChatId?: string;
  };
}

export function validateEnvironment(values: Record<string, unknown>): RawEnvironment {
  const result = environmentSchema.safeParse(values);

  if (!result.success) {
    throw new Error(`Invalid environment configuration: ${z.prettifyError(result.error)}`);
  }

  return result.data;
}

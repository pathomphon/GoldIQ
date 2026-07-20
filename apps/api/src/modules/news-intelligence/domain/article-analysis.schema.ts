import { z } from 'zod';

export const newsCategorySchema = z.enum([
  'FED',
  'INTEREST_RATE',
  'INFLATION',
  'USD',
  'BOND_YIELD',
  'GEOPOLITICS',
  'CENTRAL_BANK',
  'GOLD_DEMAND',
  'EMPLOYMENT',
  'GDP',
  'THB',
  'OTHER',
]);

export type NewsCategory = z.infer<typeof newsCategorySchema>;

export const impactStanceSchema = z.enum(['BULLISH', 'BEARISH', 'NEUTRAL']);
export type ImpactStance = z.infer<typeof impactStanceSchema>;

export const timeHorizonSchema = z.enum(['INTRADAY', 'SHORT_TERM', 'MEDIUM_TERM']);
export type TimeHorizon = z.infer<typeof timeHorizonSchema>;

export const articleFactSchema = z.object({
  claim: z.string().min(1),
  value: z.string().optional(),
});

export type ArticleFact = z.infer<typeof articleFactSchema>;

export const articleAnalysisSchema = z.object({
  relevant: z.boolean(),
  category: newsCategorySchema,
  summaryTh: z.string().min(1),
  facts: z.array(articleFactSchema),
  goldImpact: impactStanceSchema,
  thaiGoldImpact: impactStanceSchema,
  impactScore: z.number().min(-100).max(100),
  horizon: timeHorizonSchema,
  confidence: z.number().min(0).max(1),
  reasons: z.array(z.string()),
  riskFlags: z.array(z.string()),
});

export type ArticleAnalysis = z.infer<typeof articleAnalysisSchema>;

export const SINGLE_ARTICLE_SYSTEM_PROMPT = `You are the GoldIQ News Analysis Agent.

Your task is to analyze one news article and determine whether it contains information that may affect international gold prices or Thai gold prices.

You must use only the article content and metadata provided in the input.

Do not use prior knowledge to invent facts.
Do not invent sources, dates, quotes, prices, or economic figures.
Do not provide personal investment advice.
Do not calculate technical indicators.
If the article does not provide enough evidence, return a neutral result with low confidence.

Analyze the article for:
1. Relevance to gold
2. News category
3. Important verifiable facts
4. Potential impact on international gold
5. Potential impact on Thai gold
6. Expected time horizon
7. Confidence level
8. Risks or missing context

Important relationships that may be considered only when supported by the article:
* Higher interest-rate expectations may pressure gold.
* Lower interest-rate expectations may support gold.
* A stronger US dollar may pressure international gold.
* A weaker US dollar may support international gold.
* Higher bond yields may pressure gold.
* Geopolitical uncertainty may increase safe-haven demand.
* Thai gold prices may be affected by both international gold prices and USD/THB.

Return valid JSON only.`;

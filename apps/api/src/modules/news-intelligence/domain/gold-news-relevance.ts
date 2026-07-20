import type { NewsArticle } from './news.types';

const RELEVANCE_SIGNALS = [
  {
    weight: 8,
    pattern: /\b(gold|bullion|xau|precious metals?)\b/i,
  },
  {
    weight: 8,
    pattern: /(ทองคำ|ราคาทอง|ทองแท่ง|โกลด์)/i,
  },
  {
    weight: 6,
    pattern: /\b(thai baht|baht|thailand|bank of thailand)\b/i,
  },
  {
    weight: 6,
    pattern: /(เงินบาท|ค่าเงินบาท|ประเทศไทย|ธนาคารแห่งประเทศไทย)/i,
  },
  {
    weight: 4,
    pattern:
      /\b(federal funds?|interest rates?|rate decision|rate cut|rate hike|monetary policy|central banks?)\b/i,
  },
  {
    weight: 4,
    pattern: /(เงินเฟ้อ|อัตราดอกเบี้ย|ลดดอกเบี้ย|ขึ้นดอกเบี้ย|นโยบายการเงิน|ธนาคารกลาง|เฟด)/i,
  },
  {
    weight: 4,
    pattern:
      /\b(inflation|consumer price|producer price|cpi|pce|payrolls?|unemployment|employment situation|jobs report)\b/i,
  },
  {
    weight: 3,
    pattern:
      /\b(us dollar|u\.s\. dollar|dollar index|exchange rates?|treasury yields?|bond yields?|real yields?)\b/i,
  },
  {
    weight: 3,
    pattern: /(ดอลลาร์|อัตราแลกเปลี่ยน|ค่าเงิน|บอนด์ยีลด์|ผลตอบแทนพันธบัตร)/i,
  },
  {
    weight: 3,
    pattern: /\b(gdp|economic growth|recession|financial stability|market volatility)\b/i,
  },
  {
    weight: 3,
    pattern: /(จีดีพี|เศรษฐกิจ|ถดถอย|เสถียรภาพการเงิน|ความผันผวน)/i,
  },
  {
    weight: 2,
    pattern: /\b(geopolitical|war|conflict|sanctions?|tariffs?)\b/i,
  },
  {
    weight: 2,
    pattern: /(ภูมิรัฐศาสตร์|สงคราม|ความขัดแย้ง|คว่ำบาตร|ภาษีศุลกากร)/i,
  },
] as const;

export function goldNewsRelevanceScore(article: NewsArticle): number {
  const content = `${article.title}\n${article.excerpt ?? ''}`;
  return RELEVANCE_SIGNALS.reduce(
    (score, signal) => score + (signal.pattern.test(content) ? signal.weight : 0),
    0,
  );
}

export function rankGoldResearchCandidates(
  articles: readonly NewsArticle[],
  limit: number,
): readonly NewsArticle[] {
  const seenMarketReferences = new Set<string>();

  return articles
    .map((article) => ({ article, score: goldNewsRelevanceScore(article) }))
    .filter((candidate) => candidate.score >= 3)
    .sort(
      (left, right) =>
        right.score - left.score ||
        right.article.publishedAt.getTime() - left.article.publishedAt.getTime(),
    )
    .filter(({ article }) => {
      if (article.source !== 'FINNOMENA.COM') return true;
      const reference = new URL(article.canonicalUrl).searchParams.get('reference');
      if (!reference) return true;
      if (seenMarketReferences.has(reference)) return false;
      seenMarketReferences.add(reference);
      return true;
    })
    .slice(0, limit)
    .map((candidate) => candidate.article);
}

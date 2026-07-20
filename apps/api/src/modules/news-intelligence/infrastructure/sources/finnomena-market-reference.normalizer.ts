import { createHash } from 'node:crypto';
import { z } from 'zod';

import type { NormalizedNewsArticle } from '../../domain/news.types';

const thaiGoldResponseSchema = z.object({
  statusOK: z.boolean(),
  data: z.object({
    createdAt: z.string(),
    createdTime: z.string(),
    createdDateTime: z.string(),
    barBuyPrice: z.string(),
    barSellPrice: z.string(),
    barPriceChange: z.string(),
    ornamentBuyPrice: z.string(),
    ornamentSellPrice: z.string(),
  }),
});

const goldSpotResponseSchema = z.object({
  statusOK: z.boolean(),
  data: z.object({
    results: z
      .array(
        z.object({
          T: z.string(),
          d: z.string(),
          o: z.number(),
          h: z.number(),
          l: z.number(),
          c: z.number(),
          t: z.number(),
        }),
      )
      .min(1),
  }),
});

function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

function price(value: string, field: string): number {
  const result = Number(value.replaceAll(',', '').trim());
  if (!Number.isFinite(result) || result < 0) {
    throw new Error(`Invalid ${field} price from FINNOMENA`);
  }
  return result;
}

function signedNumber(value: string, field: string): number {
  const result = Number(value.replaceAll(',', '').trim());
  if (!Number.isFinite(result)) {
    throw new Error(`Invalid ${field} value from FINNOMENA`);
  }
  return result;
}

function safePublishedAt(value: string | number, fetchedAt: Date): Date {
  const publishedAt = new Date(value);
  if (
    Number.isNaN(publishedAt.getTime()) ||
    publishedAt.getTime() > fetchedAt.getTime() + 5 * 60_000
  ) {
    throw new Error('Invalid update timestamp from FINNOMENA');
  }
  return publishedAt;
}

function normalizedArticle(input: {
  externalId: string;
  canonicalUrl: string;
  title: string;
  excerpt: string;
  publishedAt: Date;
  fetchedAt: Date;
  raw: unknown;
}): NormalizedNewsArticle {
  return {
    source: 'FINNOMENA.COM',
    externalId: input.externalId,
    canonicalUrl: input.canonicalUrl,
    title: input.title,
    excerpt: input.excerpt,
    sourceTier: 'SECONDARY',
    publishedAt: input.publishedAt,
    fetchedAt: input.fetchedAt,
    rawHash: sha256(JSON.stringify(input.raw)),
    urlHash: sha256(input.canonicalUrl),
  };
}

export function normalizeFinnomenaThaiGoldReference(
  raw: unknown,
  fetchedAt = new Date(),
): readonly NormalizedNewsArticle[] {
  const response = thaiGoldResponseSchema.parse(raw);
  if (!response.statusOK) throw new Error('FINNOMENA Thai gold response was not successful');

  const data = response.data;
  const publishedAt = safePublishedAt(data.createdAt, fetchedAt);
  const barBuy = price(data.barBuyPrice, 'gold bar buy');
  const barSell = price(data.barSellPrice, 'gold bar sell');
  const ornamentBuy = price(data.ornamentBuyPrice, 'gold ornament buy');
  const ornamentSell = price(data.ornamentSellPrice, 'gold ornament sell');
  const change = signedNumber(data.barPriceChange, 'gold bar change');
  const canonicalUrl = new URL('https://www.finnomena.com/gold');
  canonicalUrl.searchParams.set('reference', 'thai-gold');
  canonicalUrl.searchParams.set('asOf', data.createdDateTime);

  return [
    normalizedArticle({
      externalId: `finnomena-thai-gold:${data.createdDateTime}`,
      canonicalUrl: canonicalUrl.toString(),
      title: 'ราคาอ้างอิงทองคำไทยล่าสุดจาก FINNOMENA',
      excerpt:
        `ราคาจากสมาคมค้าทองคำ ครั้งที่ ${data.createdTime}: ` +
        `ทองคำแท่ง 96.5% รับซื้อ ${barBuy.toFixed(2)} บาท ขายออก ${barSell.toFixed(2)} บาท ` +
        `เปลี่ยนแปลง ${change.toFixed(2)} บาท; ทองรูปพรรณ 96.5% รับซื้อ ` +
        `${ornamentBuy.toFixed(2)} บาท ขายออก ${ornamentSell.toFixed(2)} บาท ` +
        `(อัปเดต ${publishedAt.toISOString()})`,
      publishedAt,
      fetchedAt,
      raw,
    }),
  ];
}

export function normalizeFinnomenaGoldSpotReference(
  raw: unknown,
  fetchedAt = new Date(),
): readonly NormalizedNewsArticle[] {
  const response = goldSpotResponseSchema.parse(raw);
  if (!response.statusOK) throw new Error('FINNOMENA Gold Spot response was not successful');

  const result = response.data.results[0]!;
  const publishedAt = safePublishedAt(result.t, fetchedAt);
  const canonicalUrl = new URL('https://www.finnomena.com/gold/spot');
  canonicalUrl.searchParams.set('reference', 'gold-spot');
  canonicalUrl.searchParams.set('asOf', String(result.t));

  return [
    normalizedArticle({
      externalId: `finnomena-gold-spot:${result.t}`,
      canonicalUrl: canonicalUrl.toString(),
      title: 'ราคาอ้างอิง Gold Spot ล่าสุดจาก FINNOMENA',
      excerpt:
        `${result.T} วันที่ ${result.d}: เปิด ${result.o.toFixed(2)} ดอลลาร์ ` +
        `สูงสุด ${result.h.toFixed(2)} ดอลลาร์ ต่ำสุด ${result.l.toFixed(2)} ดอลลาร์ ` +
        `ปิด ${result.c.toFixed(2)} ดอลลาร์`,
      publishedAt,
      fetchedAt,
      raw,
    }),
  ];
}

import { createHash } from 'node:crypto';
import { z } from 'zod';

import type { NormalizedGoldPriceQuote } from '../../domain/gold-price.types';

const gold965ItemSchema = z
  .object({
    GoldType: z.string(),
    GoldCode: z.string(),
    Buy: z.string(),
    Sell: z.string(),
    TimeUpdate: z.string(),
    BuyChange: z.number().nullable().optional(),
    SellChange: z.number().nullable().optional(),
  })
  .passthrough();

const gold965Schema = z.array(gold965ItemSchema);

const gold9999Schema = z
  .object({
    Buy: z.string(),
    Sell: z.string(),
    TimeUpdate: z.string(),
  })
  .passthrough();

function parsePrice(value: string, field: string): number {
  const normalized = Number(value.replaceAll(',', '').trim());
  if (!Number.isFinite(normalized) || normalized < 0) {
    throw new Error(`Invalid ${field} price from Hua Seng Heng`);
  }
  return normalized;
}

function parseBangkokTimestamp(value: string): Date {
  const hasOffset = /(?:Z|[+-]\d{2}:\d{2})$/u.test(value);
  const parsed = new Date(hasOffset ? value : `${value}+07:00`);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error('Invalid update timestamp from Hua Seng Heng');
  }
  return parsed;
}

function hashPayload(productCode: string, payload: unknown): string {
  return createHash('sha256')
    .update(`${productCode}:${JSON.stringify(payload)}`)
    .digest('hex');
}

export function normalizeHuaSengHengResponses(
  raw965: unknown,
  raw9999: unknown,
  fetchedAt = new Date(),
): readonly NormalizedGoldPriceQuote[] {
  const response965 = gold965Schema.parse(raw965);
  const response9999 = gold9999Schema.parse(raw9999);
  const bar = response965.find((item) => item.GoldType === 'HSH');
  const ornament = response965.find((item) => item.GoldType === 'JEWEL');

  if (!bar || !ornament) {
    throw new Error('Hua Seng Heng 96.5 response is missing required products');
  }

  return [
    {
      productCode: 'GOLD_BAR_965',
      buyPrice: parsePrice(bar.Buy, 'GOLD_BAR_965 buy'),
      sellPrice: parsePrice(bar.Sell, 'GOLD_BAR_965 sell'),
      buyChange: bar.BuyChange ?? null,
      sellChange: bar.SellChange ?? null,
      source: 'HUA_SENG_HENG',
      sourceUpdatedAt: parseBangkokTimestamp(bar.TimeUpdate),
      fetchedAt,
      rawResponseHash: hashPayload('GOLD_BAR_965', bar),
    },
    {
      productCode: 'GOLD_ORNAMENT_965',
      buyPrice: parsePrice(ornament.Buy, 'GOLD_ORNAMENT_965 buy'),
      sellPrice: parsePrice(ornament.Sell, 'GOLD_ORNAMENT_965 sell'),
      buyChange: ornament.BuyChange ?? null,
      sellChange: ornament.SellChange ?? null,
      source: 'HUA_SENG_HENG',
      sourceUpdatedAt: parseBangkokTimestamp(ornament.TimeUpdate),
      fetchedAt,
      rawResponseHash: hashPayload('GOLD_ORNAMENT_965', ornament),
    },
    {
      productCode: 'GOLD_9999',
      buyPrice: parsePrice(response9999.Buy, 'GOLD_9999 buy'),
      sellPrice: parsePrice(response9999.Sell, 'GOLD_9999 sell'),
      buyChange: null,
      sellChange: null,
      source: 'HUA_SENG_HENG',
      sourceUpdatedAt: parseBangkokTimestamp(response9999.TimeUpdate),
      fetchedAt,
      rawResponseHash: hashPayload('GOLD_9999', response9999),
    },
  ];
}

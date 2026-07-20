import { Injectable } from '@nestjs/common';
import { type Prisma } from '@prisma/client';

import { PrismaService } from '../../../../infrastructure/database/prisma.service';
import { GOLD_PRODUCTS, type GoldProductCode } from '../../domain/gold-product';
import type { GoldPriceRepositoryPort } from '../../domain/gold-price-repository.port';
import type {
  CandleResolution,
  FindCandlesQueryOptions,
  GoldPriceCandleSnapshot,
  GoldPriceSnapshot,
  NormalizedGoldPriceQuote,
  SaveGoldPricesResult,
} from '../../domain/gold-price.types';

type GoldPriceWithProduct = Prisma.GoldPriceGetPayload<{
  include: { product: true };
}>;

type GoldPriceCandleWithProduct = Prisma.GoldPriceCandleGetPayload<{
  include: { product: true };
}>;

const ALL_RESOLUTIONS: readonly CandleResolution[] = ['M1', 'M5', 'M15', 'H1', 'D1'];

export function getBucketStart(date: Date, resolution: CandleResolution): Date {
  const d = new Date(date.getTime());
  d.setUTCMilliseconds(0);
  d.setUTCSeconds(0);

  switch (resolution) {
    case 'M1':
      break;
    case 'M5': {
      const min = d.getUTCMinutes();
      d.setUTCMinutes(min - (min % 5));
      break;
    }
    case 'M15': {
      const min = d.getUTCMinutes();
      d.setUTCMinutes(min - (min % 15));
      break;
    }
    case 'H1':
      d.setUTCMinutes(0);
      break;
    case 'D1':
      d.setUTCHours(0, 0, 0, 0);
      break;
  }
  return d;
}

function toSnapshot(record: GoldPriceWithProduct): GoldPriceSnapshot {
  return {
    id: record.id,
    productCode: record.product.code as GoldProductCode,
    productName: record.product.name,
    purity: record.product.purity.toNumber(),
    buyPrice: record.buyPrice.toNumber(),
    sellPrice: record.sellPrice.toNumber(),
    buyChange: record.buyChange?.toNumber() ?? null,
    sellChange: record.sellChange?.toNumber() ?? null,
    source: 'HUA_SENG_HENG',
    sourceUpdatedAt: record.sourceUpdatedAt,
    fetchedAt: record.fetchedAt,
    rawResponseHash: record.rawResponseHash,
  };
}

function toCandleSnapshot(record: GoldPriceCandleWithProduct): GoldPriceCandleSnapshot {
  return {
    id: record.id,
    productCode: record.product.code as GoldProductCode,
    resolution: record.resolution,
    bucketStart: record.bucketStart,
    openBuy: record.openBuy.toNumber(),
    highBuy: record.highBuy.toNumber(),
    lowBuy: record.lowBuy.toNumber(),
    closeBuy: record.closeBuy.toNumber(),
    openSell: record.openSell.toNumber(),
    highSell: record.highSell.toNumber(),
    lowSell: record.lowSell.toNumber(),
    closeSell: record.closeSell.toNumber(),
    ticksCount: record.ticksCount,
  };
}

@Injectable()
export class PrismaGoldPriceRepository implements GoldPriceRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async saveQuotes(quotes: readonly NormalizedGoldPriceQuote[]): Promise<SaveGoldPricesResult> {
    const inserted = await this.prisma.$transaction(async (transaction) => {
      const productIds = new Map<GoldProductCode, string>();

      for (const product of Object.values(GOLD_PRODUCTS)) {
        const stored = await transaction.goldProduct.upsert({
          where: { code: product.code },
          create: product,
          update: {
            name: product.name,
            purity: product.purity,
            sourceProductCode: product.sourceProductCode,
          },
          select: { id: true },
        });
        productIds.set(product.code, stored.id);
      }

      const result = await transaction.goldPrice.createMany({
        data: quotes.map((quote) => {
          const productId = productIds.get(quote.productCode);
          if (!productId) {
            throw new Error(`Unknown gold product: ${quote.productCode}`);
          }

          return {
            productId,
            buyPrice: quote.buyPrice,
            sellPrice: quote.sellPrice,
            buyChange: quote.buyChange,
            sellChange: quote.sellChange,
            source: quote.source,
            sourceUpdatedAt: quote.sourceUpdatedAt,
            fetchedAt: quote.fetchedAt,
            rawResponseHash: quote.rawResponseHash,
          };
        }),
        skipDuplicates: true,
      });

      return result.count;
    });

    return {
      received: quotes.length,
      inserted,
      duplicates: quotes.length - inserted,
    };
  }

  async upsertCandles(quotes: readonly NormalizedGoldPriceQuote[]): Promise<void> {
    if (quotes.length === 0) return;

    await this.prisma.$transaction(async (transaction) => {
      const productIds = new Map<GoldProductCode, string>();

      for (const product of Object.values(GOLD_PRODUCTS)) {
        const stored = await transaction.goldProduct.upsert({
          where: { code: product.code },
          create: product,
          update: {
            name: product.name,
            purity: product.purity,
            sourceProductCode: product.sourceProductCode,
          },
          select: { id: true },
        });
        productIds.set(product.code, stored.id);
      }

      for (const quote of quotes) {
        const productId = productIds.get(quote.productCode);
        if (!productId) continue;

        for (const resolution of ALL_RESOLUTIONS) {
          const bucketStart = getBucketStart(quote.sourceUpdatedAt, resolution);
          const prismaResolution = resolution;

          const existing = await transaction.goldPriceCandle.findUnique({
            where: {
              productId_resolution_bucketStart: {
                productId,
                resolution: prismaResolution,
                bucketStart,
              },
            },
          });

          if (!existing) {
            await transaction.goldPriceCandle.create({
              data: {
                productId,
                resolution: prismaResolution,
                bucketStart,
                openBuy: quote.buyPrice,
                highBuy: quote.buyPrice,
                lowBuy: quote.buyPrice,
                closeBuy: quote.buyPrice,
                openSell: quote.sellPrice,
                highSell: quote.sellPrice,
                lowSell: quote.sellPrice,
                closeSell: quote.sellPrice,
                ticksCount: 1,
              },
            });
          } else {
            const highBuy = Math.max(existing.highBuy.toNumber(), quote.buyPrice);
            const lowBuy = Math.min(existing.lowBuy.toNumber(), quote.buyPrice);
            const highSell = Math.max(existing.highSell.toNumber(), quote.sellPrice);
            const lowSell = Math.min(existing.lowSell.toNumber(), quote.sellPrice);

            await transaction.goldPriceCandle.update({
              where: { id: existing.id },
              data: {
                highBuy,
                lowBuy,
                closeBuy: quote.buyPrice,
                highSell,
                lowSell,
                closeSell: quote.sellPrice,
                ticksCount: existing.ticksCount + 1,
              },
            });
          }
        }
      }
    });
  }

  async findCurrentPrices(): Promise<readonly GoldPriceSnapshot[]> {
    const records = await this.prisma.goldPrice.findMany({
      distinct: ['productId'],
      include: { product: true },
      orderBy: [{ productId: 'asc' }, { sourceUpdatedAt: 'desc' }, { fetchedAt: 'desc' }],
    });
    const snapshots = records.map(toSnapshot);
    const productOrder = new Map(Object.keys(GOLD_PRODUCTS).map((code, index) => [code, index]));

    return snapshots.sort(
      (left, right) =>
        (productOrder.get(left.productCode) ?? 0) - (productOrder.get(right.productCode) ?? 0),
    );
  }

  async findHistory(
    productCode: GoldProductCode | undefined,
    limit: number,
  ): Promise<readonly GoldPriceSnapshot[]> {
    const records = await this.prisma.goldPrice.findMany({
      where: productCode ? { product: { code: productCode } } : undefined,
      include: { product: true },
      orderBy: [{ sourceUpdatedAt: 'desc' }, { fetchedAt: 'desc' }],
      take: limit,
    });

    return records.map(toSnapshot);
  }

  async findCandles(options: FindCandlesQueryOptions): Promise<readonly GoldPriceCandleSnapshot[]> {
    const { productCode, resolution, from, to, limit = 500 } = options;

    const records = await this.prisma.goldPriceCandle.findMany({
      where: {
        product: { code: productCode },
        resolution,
        bucketStart: {
          gte: from,
          lte: to,
        },
      },
      include: { product: true },
      orderBy: { bucketStart: 'asc' },
      take: limit,
    });

    return records.map(toCandleSnapshot);
  }

  async purgeOldRawPrices(olderThan: Date): Promise<number> {
    const result = await this.prisma.goldPrice.deleteMany({
      where: {
        fetchedAt: {
          lt: olderThan,
        },
      },
    });
    return result.count;
  }
}

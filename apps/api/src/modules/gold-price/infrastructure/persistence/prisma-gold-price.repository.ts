import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';

import { PrismaService } from '../../../../infrastructure/database/prisma.service';
import { GOLD_PRODUCTS, type GoldProductCode } from '../../domain/gold-product';
import type { GoldPriceRepositoryPort } from '../../domain/gold-price-repository.port';
import type {
  GoldPriceSnapshot,
  NormalizedGoldPriceQuote,
  SaveGoldPricesResult,
} from '../../domain/gold-price.types';

type GoldPriceWithProduct = Prisma.GoldPriceGetPayload<{
  include: { product: true };
}>;

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
}

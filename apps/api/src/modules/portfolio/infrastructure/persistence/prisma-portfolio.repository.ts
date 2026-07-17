import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';

import { PrismaService } from '../../../../infrastructure/database/prisma.service';
import { GOLD_PRODUCTS, type GoldProductCode } from '../../../gold-price/domain/gold-product';
import type { PortfolioRepositoryPort } from '../../domain/portfolio.repository.port';
import type {
  CurrentBuyPrice,
  GoldTransaction,
  GoldTransactionInput,
} from '../../domain/portfolio.types';

type TransactionWithProduct = Prisma.GoldTransactionGetPayload<{
  include: { product: true };
}>;

function toTransaction(record: TransactionWithProduct): GoldTransaction {
  return {
    id: record.id,
    productCode: record.product.code as GoldProductCode,
    productName: record.product.name,
    purchasedAt: record.purchasedAt,
    purchasePrice: record.purchasePrice.toNumber(),
    investmentAmount: record.investmentAmount.toNumber(),
    goldWeight: record.goldWeight.toNumber(),
    fee: record.fee.toNumber(),
    notes: record.notes,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

function productConnection(productCode: GoldProductCode) {
  const product = GOLD_PRODUCTS[productCode];
  return {
    connectOrCreate: {
      where: { code: product.code },
      create: product,
    },
  };
}

@Injectable()
export class PrismaPortfolioRepository implements PortfolioRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async findTransactions(): Promise<readonly GoldTransaction[]> {
    const records = await this.prisma.goldTransaction.findMany({
      include: { product: true },
      orderBy: [{ purchasedAt: 'desc' }, { createdAt: 'desc' }],
    });
    return records.map(toTransaction);
  }

  async findTransaction(id: string): Promise<GoldTransaction | null> {
    const record = await this.prisma.goldTransaction.findUnique({
      where: { id },
      include: { product: true },
    });
    return record ? toTransaction(record) : null;
  }

  async createTransaction(input: GoldTransactionInput): Promise<GoldTransaction> {
    const record = await this.prisma.goldTransaction.create({
      data: {
        purchasedAt: input.purchasedAt,
        purchasePrice: input.purchasePrice,
        investmentAmount: input.investmentAmount,
        goldWeight: input.goldWeight,
        fee: input.fee,
        notes: input.notes,
        product: productConnection(input.productCode),
      },
      include: { product: true },
    });
    return toTransaction(record);
  }

  async updateTransaction(
    id: string,
    input: GoldTransactionInput,
  ): Promise<GoldTransaction | null> {
    const existing = await this.prisma.goldTransaction.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!existing) {
      return null;
    }

    const record = await this.prisma.goldTransaction.update({
      where: { id },
      data: {
        purchasedAt: input.purchasedAt,
        purchasePrice: input.purchasePrice,
        investmentAmount: input.investmentAmount,
        goldWeight: input.goldWeight,
        fee: input.fee,
        notes: input.notes,
        product: productConnection(input.productCode),
      },
      include: { product: true },
    });
    return toTransaction(record);
  }

  async deleteTransaction(id: string): Promise<boolean> {
    const result = await this.prisma.goldTransaction.deleteMany({
      where: { id },
    });
    return result.count === 1;
  }

  async findCurrentBuyPrices(): Promise<readonly CurrentBuyPrice[]> {
    const records = await this.prisma.goldPrice.findMany({
      distinct: ['productId'],
      include: { product: true },
      orderBy: [{ productId: 'asc' }, { sourceUpdatedAt: 'desc' }, { fetchedAt: 'desc' }],
    });
    return records.map((record) => ({
      productCode: record.product.code as GoldProductCode,
      buyPrice: record.buyPrice.toNumber(),
    }));
  }

  async findLatestPriceTimestamp(): Promise<Date | null> {
    const latest = await this.prisma.goldPrice.findFirst({
      orderBy: { sourceUpdatedAt: 'desc' },
      select: { sourceUpdatedAt: true },
    });
    return latest?.sourceUpdatedAt ?? null;
  }
}

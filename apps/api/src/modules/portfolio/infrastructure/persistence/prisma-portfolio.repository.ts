import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';

import { PrismaService } from '../../../../infrastructure/database/prisma.service';
import { GOLD_PRODUCTS, type GoldProductCode } from '../../../gold-price/domain/gold-product';
import type { PortfolioRepositoryPort } from '../../domain/portfolio.repository.port';
import type {
  CurrentBuyPrice,
  GoldSale,
  GoldSaleInput,
  GoldSaleUpdateInput,
  GoldTransaction,
  GoldTransactionInput,
} from '../../domain/portfolio.types';

type TransactionWithProduct = Prisma.GoldTransactionGetPayload<{
  include: { product: true; sales: true };
}>;

type SaleRecord = Prisma.GoldSaleGetPayload<Record<string, never>>;

function toSale(record: SaleRecord): GoldSale {
  return {
    id: record.id,
    purchaseTransactionId: record.purchaseTransactionId,
    soldAt: record.soldAt,
    salePrice: record.salePrice.toNumber(),
    goldWeight: record.goldWeight.toNumber(),
    fee: record.fee.toNumber(),
    notes: record.notes,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

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
    sales: record.sales.map(toSale),
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
      include: {
        product: true,
        sales: { orderBy: [{ soldAt: 'desc' }, { createdAt: 'desc' }] },
      },
      orderBy: [{ purchasedAt: 'desc' }, { createdAt: 'desc' }],
    });
    return records.map(toTransaction);
  }

  async findTransaction(id: string): Promise<GoldTransaction | null> {
    const record = await this.prisma.goldTransaction.findUnique({
      where: { id },
      include: {
        product: true,
        sales: { orderBy: [{ soldAt: 'desc' }, { createdAt: 'desc' }] },
      },
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
      include: { product: true, sales: true },
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
      include: { product: true, sales: true },
    });
    return toTransaction(record);
  }

  async deleteTransaction(id: string): Promise<boolean> {
    const result = await this.prisma.goldTransaction.deleteMany({
      where: { id },
    });
    return result.count === 1;
  }

  async findSale(id: string): Promise<GoldSale | null> {
    const record = await this.prisma.goldSale.findUnique({ where: { id } });
    return record ? toSale(record) : null;
  }

  async createSale(input: GoldSaleInput) {
    return this.runSerializable(async (transaction) => {
      const purchase = await this.findTransactionRecord(transaction, input.purchaseTransactionId);
      if (!purchase) {
        return { ok: false as const, reason: 'PURCHASE_NOT_FOUND' as const };
      }
      const validation = this.validateSale(
        purchase,
        input.soldAt,
        input.goldWeight,
        purchase.sales,
      );
      if (validation) {
        return { ok: false as const, reason: validation };
      }

      const sale = await transaction.goldSale.create({
        data: {
          purchaseTransactionId: input.purchaseTransactionId,
          soldAt: input.soldAt,
          salePrice: input.salePrice,
          goldWeight: input.goldWeight,
          fee: input.fee,
          notes: input.notes,
        },
      });
      const updatedPurchase = await this.findTransactionRecord(
        transaction,
        input.purchaseTransactionId,
      );
      if (!updatedPurchase) {
        return { ok: false as const, reason: 'PURCHASE_NOT_FOUND' as const };
      }
      return {
        ok: true as const,
        sale: toSale(sale),
        transaction: toTransaction(updatedPurchase),
      };
    });
  }

  async updateSale(id: string, input: GoldSaleUpdateInput) {
    return this.runSerializable(async (transaction) => {
      const existing = await transaction.goldSale.findUnique({ where: { id } });
      if (!existing) {
        return { ok: false as const, reason: 'SALE_NOT_FOUND' as const };
      }
      const purchase = await this.findTransactionRecord(
        transaction,
        existing.purchaseTransactionId,
      );
      if (!purchase) {
        return { ok: false as const, reason: 'PURCHASE_NOT_FOUND' as const };
      }
      const otherSales = purchase.sales.filter((sale) => sale.id !== id);
      const validation = this.validateSale(purchase, input.soldAt, input.goldWeight, otherSales);
      if (validation) {
        return { ok: false as const, reason: validation };
      }

      const sale = await transaction.goldSale.update({
        where: { id },
        data: {
          soldAt: input.soldAt,
          salePrice: input.salePrice,
          goldWeight: input.goldWeight,
          fee: input.fee,
          notes: input.notes,
        },
      });
      const updatedPurchase = await this.findTransactionRecord(
        transaction,
        existing.purchaseTransactionId,
      );
      if (!updatedPurchase) {
        return { ok: false as const, reason: 'PURCHASE_NOT_FOUND' as const };
      }
      return {
        ok: true as const,
        sale: toSale(sale),
        transaction: toTransaction(updatedPurchase),
      };
    });
  }

  async deleteSale(id: string): Promise<boolean> {
    const result = await this.prisma.goldSale.deleteMany({ where: { id } });
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

  private findTransactionRecord(transaction: Prisma.TransactionClient, id: string) {
    return transaction.goldTransaction.findUnique({
      where: { id },
      include: {
        product: true,
        sales: { orderBy: [{ soldAt: 'desc' }, { createdAt: 'desc' }] },
      },
    });
  }

  private validateSale(
    purchase: TransactionWithProduct,
    soldAt: Date,
    goldWeight: number,
    existingSales: readonly SaleRecord[],
  ): 'SALE_BEFORE_PURCHASE' | 'INSUFFICIENT_WEIGHT' | null {
    if (soldAt < purchase.purchasedAt) {
      return 'SALE_BEFORE_PURCHASE';
    }
    const soldWeight = existingSales.reduce((sum, sale) => sum + sale.goldWeight.toNumber(), 0);
    return soldWeight + goldWeight > purchase.goldWeight.toNumber() + 0.0000005
      ? 'INSUFFICIENT_WEIGHT'
      : null;
  }

  private async runSerializable<Result>(
    operation: (transaction: Prisma.TransactionClient) => Promise<Result>,
  ): Promise<Result> {
    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        return await this.prisma.$transaction(operation, {
          isolationLevel: 'Serializable',
        });
      } catch (error) {
        const code =
          typeof error === 'object' && error !== null && 'code' in error
            ? String(error.code)
            : null;
        if (code !== 'P2034' || attempt === 2) {
          throw error;
        }
      }
    }
    throw new Error('Serializable transaction retry exhausted');
  }
}

import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';

import { PrismaService } from '../../../../infrastructure/database/prisma.service';
import { GOLD_PRODUCTS, type GoldProductCode } from '../../../gold-price/domain/gold-product';
import type { BuyPlanRepositoryPort } from '../../domain/buy-plan.repository.port';
import type {
  AlertDeliveryStatus,
  AlertEvent,
  BuyPlan,
  BuyPlanLevelStatus,
  CreateBuyPlanInput,
  CurrentSellPrice,
  WaitingBuyLevel,
} from '../../domain/buy-plan.types';

type PlanRecord = Prisma.BuyPlanGetPayload<{
  include: { product: true; levels: true };
}>;
type AlertRecord = Prisma.AlertEventGetPayload<{
  include: { buyPlanLevel: { include: { buyPlan: true } } };
}>;

function toPlan(record: PlanRecord): BuyPlan {
  return {
    id: record.id,
    name: record.name,
    productCode: record.product.code as GoldProductCode,
    productName: record.product.name,
    isActive: record.isActive,
    createdAt: record.createdAt,
    levels: record.levels
      .toSorted((left, right) => left.sequence - right.sequence)
      .map((level) => ({
        id: level.id,
        targetPrice: level.targetPrice.toNumber(),
        investmentAmount: level.investmentAmount.toNumber(),
        sequence: level.sequence,
        status: level.status,
        triggeredAt: level.triggeredAt,
        executedAt: level.executedAt,
      })),
  };
}

function toAlert(record: AlertRecord): AlertEvent {
  return {
    id: record.id,
    planName: record.buyPlanLevel.buyPlan.name,
    levelSequence: record.buyPlanLevel.sequence,
    observedPrice: record.observedPrice.toNumber(),
    message: record.message,
    deliveryStatus: record.deliveryStatus,
    triggeredAt: record.triggeredAt,
  };
}

@Injectable()
export class PrismaBuyPlanRepository implements BuyPlanRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async findPlans(): Promise<readonly BuyPlan[]> {
    const records = await this.prisma.buyPlan.findMany({
      include: { product: true, levels: true },
      orderBy: { createdAt: 'desc' },
    });
    return records.map(toPlan);
  }

  async findRecentAlerts(limit: number): Promise<readonly AlertEvent[]> {
    const records = await this.prisma.alertEvent.findMany({
      include: { buyPlanLevel: { include: { buyPlan: true } } },
      orderBy: { triggeredAt: 'desc' },
      take: limit,
    });
    return records.map(toAlert);
  }

  async createPlan(input: CreateBuyPlanInput): Promise<BuyPlan> {
    const product = GOLD_PRODUCTS[input.productCode];
    const record = await this.prisma.buyPlan.create({
      data: {
        name: input.name,
        product: {
          connectOrCreate: {
            where: { code: product.code },
            create: product,
          },
        },
        levels: {
          create: input.levels.map((level) => ({
            targetPrice: level.targetPrice,
            investmentAmount: level.investmentAmount,
            sequence: level.sequence,
          })),
        },
      },
      include: { product: true, levels: true },
    });
    return toPlan(record);
  }

  async deletePlan(id: string): Promise<boolean> {
    const result = await this.prisma.buyPlan.deleteMany({ where: { id } });
    return result.count === 1;
  }

  async updateLevelStatus(id: string, status: BuyPlanLevelStatus): Promise<boolean> {
    const now = new Date();
    const result = await this.prisma.buyPlanLevel.updateMany({
      where: { id },
      data: {
        status,
        triggeredAt: status === 'WAITING' ? null : undefined,
        executedAt: status === 'EXECUTED' ? now : status === 'WAITING' ? null : undefined,
        cancelledAt: status === 'CANCELLED' ? now : status === 'WAITING' ? null : undefined,
      },
    });
    return result.count === 1;
  }

  async findWaitingLevels(): Promise<readonly WaitingBuyLevel[]> {
    const records = await this.prisma.buyPlanLevel.findMany({
      where: { status: 'WAITING', buyPlan: { isActive: true } },
      include: { buyPlan: { include: { product: true } } },
    });
    return records.map((record) => ({
      id: record.id,
      planName: record.buyPlan.name,
      productCode: record.buyPlan.product.code as GoldProductCode,
      sequence: record.sequence,
      targetPrice: record.targetPrice.toNumber(),
      investmentAmount: record.investmentAmount.toNumber(),
    }));
  }

  async findCurrentSellPrices(): Promise<readonly CurrentSellPrice[]> {
    const records = await this.prisma.goldPrice.findMany({
      distinct: ['productId'],
      include: { product: true },
      orderBy: [{ productId: 'asc' }, { sourceUpdatedAt: 'desc' }, { fetchedAt: 'desc' }],
    });
    return records.map((record) => ({
      productCode: record.product.code as GoldProductCode,
      sellPrice: record.sellPrice.toNumber(),
    }));
  }

  async triggerLevel(
    level: WaitingBuyLevel,
    observedPrice: number,
    message: string,
  ): Promise<string | null> {
    return this.prisma.$transaction(async (transaction) => {
      const updated = await transaction.buyPlanLevel.updateMany({
        where: { id: level.id, status: 'WAITING' },
        data: { status: 'TRIGGERED', triggeredAt: new Date() },
      });
      if (updated.count === 0) {
        return null;
      }
      const event = await transaction.alertEvent.create({
        data: {
          buyPlanLevelId: level.id,
          observedPrice,
          message,
          deliveryStatus: 'PENDING',
        },
      });
      return event.id;
    });
  }

  async updateAlertDelivery(
    eventId: string,
    status: AlertDeliveryStatus,
    error: string | null,
  ): Promise<void> {
    await this.prisma.alertEvent.update({
      where: { id: eventId },
      data: { deliveryStatus: status, deliveryError: error },
    });
  }
}

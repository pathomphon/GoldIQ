import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';

import { PrismaService } from '../../../../infrastructure/database/prisma.service';
import type { RecommendationRepositoryPort } from '../../domain/recommendation.repository.port';
import type {
  RecommendationContext,
  RiskProfile,
  RiskSettings,
} from '../../domain/recommendation.types';

const SETTINGS_KEY = 'recommendation.risk-settings';
const defaultSettings: RiskSettings = {
  riskProfile: 'BALANCED',
  availableCash: 50_000,
  minimumCashReserve: 10_000,
  maxAllocationPercent: 50,
  profitTargetPercent: 5,
  sellPartialPercent: 25,
  stopBuyAbovePrice: null,
};

function numberValue(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function parseSettings(value: Prisma.JsonValue | undefined): RiskSettings {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return defaultSettings;
  }
  const item = value as Record<string, Prisma.JsonValue>;
  const riskProfile: RiskProfile =
    item.riskProfile === 'CONSERVATIVE' ||
    item.riskProfile === 'BALANCED' ||
    item.riskProfile === 'AGGRESSIVE'
      ? item.riskProfile
      : defaultSettings.riskProfile;
  return {
    riskProfile,
    availableCash: numberValue(item.availableCash, defaultSettings.availableCash),
    minimumCashReserve: numberValue(item.minimumCashReserve, defaultSettings.minimumCashReserve),
    maxAllocationPercent: numberValue(
      item.maxAllocationPercent,
      defaultSettings.maxAllocationPercent,
    ),
    profitTargetPercent: numberValue(item.profitTargetPercent, defaultSettings.profitTargetPercent),
    sellPartialPercent: numberValue(item.sellPartialPercent, defaultSettings.sellPartialPercent),
    stopBuyAbovePrice:
      item.stopBuyAbovePrice === null
        ? null
        : numberValue(item.stopBuyAbovePrice, defaultSettings.stopBuyAbovePrice ?? 0) || null,
  };
}

@Injectable()
export class PrismaRecommendationRepository implements RecommendationRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async getSettings(): Promise<RiskSettings> {
    const record = await this.prisma.applicationSetting.findUnique({
      where: { key: SETTINGS_KEY },
      select: { value: true },
    });
    return parseSettings(record?.value);
  }

  async saveSettings(settings: RiskSettings): Promise<RiskSettings> {
    const value = settings as unknown as Prisma.InputJsonValue;
    const record = await this.prisma.applicationSetting.upsert({
      where: { key: SETTINGS_KEY },
      create: {
        key: SETTINGS_KEY,
        value,
        description: 'Risk and cash-allocation settings for the recommendation engine',
      },
      update: { value },
      select: { value: true },
    });
    return parseSettings(record.value);
  }

  async getContext(): Promise<RecommendationContext> {
    const [latest, transactions, level] = await Promise.all([
      this.prisma.goldPrice.findFirst({
        where: { product: { code: 'GOLD_BAR_965' } },
        orderBy: [{ sourceUpdatedAt: 'desc' }, { fetchedAt: 'desc' }],
      }),
      this.prisma.goldTransaction.findMany({
        where: { product: { code: 'GOLD_BAR_965' } },
        include: { sales: { select: { goldWeight: true } } },
      }),
      this.prisma.buyPlanLevel.findFirst({
        where: {
          status: { in: ['WAITING', 'TRIGGERED'] },
          buyPlan: { isActive: true, product: { code: 'GOLD_BAR_965' } },
        },
        include: { buyPlan: true },
        orderBy: [{ targetPrice: 'desc' }, { sequence: 'asc' }],
      }),
    ]);

    const positions = transactions.map((item) => {
      const originalWeight = item.goldWeight.toNumber();
      const soldWeight = item.sales.reduce((sum, sale) => sum + sale.goldWeight.toNumber(), 0);
      const remainingWeight = Math.max(0, originalWeight - soldWeight);
      const totalCost = item.investmentAmount.toNumber() + item.fee.toNumber();
      return {
        remainingWeight,
        remainingCost: originalWeight > 0 ? totalCost * (remainingWeight / originalWeight) : 0,
      };
    });
    const totalInvested = positions.reduce((sum, item) => sum + item.remainingCost, 0);
    const totalGoldWeight = positions.reduce((sum, item) => sum + item.remainingWeight, 0);
    const currentBuyPrice = latest?.buyPrice.toNumber() ?? null;
    const currentValue = currentBuyPrice === null ? 0 : totalGoldWeight * currentBuyPrice;

    return {
      observedAt: latest?.sourceUpdatedAt ?? null,
      currentBuyPrice,
      currentSellPrice: latest?.sellPrice.toNumber() ?? null,
      totalInvested,
      totalGoldWeight,
      averageCost: totalGoldWeight > 0 ? totalInvested / totalGoldWeight : 0,
      currentValue,
      profitLossPercentage:
        totalInvested > 0 ? ((currentValue - totalInvested) / totalInvested) * 100 : 0,
      nextBuyLevel: level
        ? {
            targetPrice: level.targetPrice.toNumber(),
            investmentAmount: level.investmentAmount.toNumber(),
            sequence: level.sequence,
            planName: level.buyPlan.name,
          }
        : null,
    };
  }
}

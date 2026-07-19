import { describe, expect, it, vi } from 'vitest';

import type { PrismaService } from '../../../../infrastructure/database/prisma.service';
import { PrismaRecommendationRepository } from './prisma-recommendation.repository';

function decimal(value: number) {
  return { toNumber: () => value };
}

describe('PrismaRecommendationRepository', () => {
  it('uses only remaining gold weight and cost after partial sales', async () => {
    const prisma = {
      goldPrice: {
        findFirst: vi.fn().mockResolvedValue({
          buyPrice: decimal(63_000),
          sellPrice: decimal(63_100),
          sourceUpdatedAt: new Date('2026-07-19T10:00:00.000Z'),
        }),
      },
      goldTransaction: {
        findMany: vi.fn().mockResolvedValue([
          {
            investmentAmount: decimal(60_000),
            fee: decimal(100),
            goldWeight: decimal(1),
            sales: [{ goldWeight: decimal(0.4) }],
          },
        ]),
      },
      buyPlanLevel: { findFirst: vi.fn().mockResolvedValue(null) },
    } as unknown as PrismaService;
    const repository = new PrismaRecommendationRepository(prisma);

    const context = await repository.getContext();

    expect(context.totalGoldWeight).toBe(0.6);
    expect(context.totalInvested).toBe(36_060);
    expect(context.averageCost).toBe(60_100);
  });
});

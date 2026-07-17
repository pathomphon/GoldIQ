import type { CurrentSellPrice, WaitingBuyLevel } from './buy-plan.types';

export interface TriggerCandidate {
  readonly level: WaitingBuyLevel;
  readonly observedPrice: number;
  readonly message: string;
}

export function findTriggeredLevels(
  levels: readonly WaitingBuyLevel[],
  prices: readonly CurrentSellPrice[],
): readonly TriggerCandidate[] {
  const pricesByProduct = new Map(prices.map((price) => [price.productCode, price.sellPrice]));

  return levels.flatMap((level) => {
    const observedPrice = pricesByProduct.get(level.productCode);
    if (observedPrice === undefined || observedPrice > level.targetPrice) {
      return [];
    }
    return [
      {
        level,
        observedPrice,
        message:
          `${level.planName}: ราคา ฿${observedPrice.toLocaleString('th-TH')} ถึงไม้ #${level.sequence} ` +
          `(เป้าหมาย ฿${level.targetPrice.toLocaleString('th-TH')}) แผนลงทุน ฿${level.investmentAmount.toLocaleString('th-TH')}`,
      },
    ];
  });
}

import type { Recommendation, RecommendationContext, RiskSettings } from './recommendation.types';

function round(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function buildRecommendation(
  market: RecommendationContext,
  settings: RiskSettings,
): Recommendation {
  const reservedCash = Math.min(settings.availableCash, settings.minimumCashReserve);
  const allocationCap = settings.availableCash * (settings.maxAllocationPercent / 100);
  const deployableCash = round(
    Math.max(0, Math.min(allocationCap, settings.availableCash - reservedCash)),
  );
  const nextAmount = market.nextBuyLevel?.investmentAmount ?? 0;
  const recommendedAmount = round(Math.min(deployableCash, nextAmount));
  const base = {
    allocation: {
      availableCash: settings.availableCash,
      reservedCash: round(reservedCash),
      deployableCash,
    },
    market,
    settings,
  };

  if (market.currentSellPrice === null || market.currentBuyPrice === null) {
    return {
      ...base,
      action: 'WAIT',
      reasons: ['ยังไม่มีราคาล่าสุดเพียงพอสำหรับประเมินคำแนะนำ'],
      recommendedAmount: 0,
      sellPartialPercent: null,
    };
  }

  if (market.totalGoldWeight > 0 && market.profitLossPercentage >= settings.profitTargetPercent) {
    return {
      ...base,
      action: 'SELL_PARTIAL',
      reasons: [
        `กำไรพอร์ต ${market.profitLossPercentage.toFixed(2)}% ถึงเป้าหมาย ${settings.profitTargetPercent.toFixed(2)}%`,
        `พิจารณาลดความเสี่ยงโดยขายบางส่วน ${settings.sellPartialPercent}%`,
      ],
      recommendedAmount: 0,
      sellPartialPercent: settings.sellPartialPercent,
    };
  }

  if (
    market.totalGoldWeight > 0 &&
    market.profitLossPercentage >= settings.profitTargetPercent * 0.75
  ) {
    return {
      ...base,
      action: 'REVIEW_PROFIT',
      reasons: [
        `กำไรพอร์ต ${market.profitLossPercentage.toFixed(2)}% ใกล้เป้าหมาย ${settings.profitTargetPercent.toFixed(2)}%`,
        'ควรทบทวนจุดทำกำไรและสัดส่วนทองในพอร์ต',
      ],
      recommendedAmount: 0,
      sellPartialPercent: null,
    };
  }

  if (
    settings.stopBuyAbovePrice !== null &&
    market.currentSellPrice >= settings.stopBuyAbovePrice
  ) {
    return {
      ...base,
      action: 'HOLD',
      reasons: [
        `ราคาขายปัจจุบัน ${market.currentSellPrice.toFixed(2)} บาท ถึงเงื่อนไขหยุดซื้อ ${settings.stopBuyAbovePrice.toFixed(2)} บาท`,
      ],
      recommendedAmount: 0,
      sellPartialPercent: null,
    };
  }

  if (!market.nextBuyLevel) {
    return {
      ...base,
      action: market.totalGoldWeight > 0 ? 'HOLD' : 'WAIT',
      reasons: ['ยังไม่มี Buy Level ที่รอดำเนินการ'],
      recommendedAmount: 0,
      sellPartialPercent: null,
    };
  }

  if (market.currentSellPrice <= market.nextBuyLevel.targetPrice) {
    if (recommendedAmount <= 0 || recommendedAmount < market.nextBuyLevel.investmentAmount) {
      return {
        ...base,
        action: 'WAIT',
        reasons: [
          `ราคาลดลงผ่าน Buy Level #${market.nextBuyLevel.sequence} แล้ว`,
          'เงินสดที่จัดสรรได้ไม่เพียงพอ โดยต้องรักษาเงินสำรองตามค่าความเสี่ยง',
        ],
        recommendedAmount,
        sellPartialPercent: null,
      };
    }

    return {
      ...base,
      action: 'BUY',
      reasons: [
        `ราคาลดลงผ่าน Buy Level #${market.nextBuyLevel.sequence} ที่ ${market.nextBuyLevel.targetPrice.toFixed(2)} บาท`,
        `เงินสดหลังกันสำรองเพียงพอสำหรับแผน ${market.nextBuyLevel.planName}`,
      ],
      recommendedAmount,
      sellPartialPercent: null,
    };
  }

  return {
    ...base,
    action: market.totalGoldWeight > 0 ? 'HOLD' : 'WAIT',
    reasons: [
      `ราคายังไม่ถึง Buy Level #${market.nextBuyLevel.sequence} ที่ ${market.nextBuyLevel.targetPrice.toFixed(2)} บาท`,
      market.totalGoldWeight > 0
        ? 'ถือสถานะเดิมและรอระดับราคาตามแผน'
        : 'รอจังหวะตามแผนก่อนเริ่มลงทุน',
    ],
    recommendedAmount: 0,
    sellPartialPercent: null,
  };
}

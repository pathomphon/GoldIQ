import type {
  ExplainableEvidence,
  Recommendation,
  RecommendationAction,
  RecommendationContext,
  RiskSettings,
} from './recommendation.types';

function round(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function buildEvidence(market: RecommendationContext): ExplainableEvidence {
  const avgCostVsPrice =
    market.averageCost > 0 && market.currentSellPrice
      ? ((market.currentSellPrice - market.averageCost) / market.averageCost) * 100
      : 0;

  return {
    technical: {
      summary:
        market.currentSellPrice !== null
          ? `ราคาทองปัจจุบันอยู่ที่ ${market.currentSellPrice.toFixed(2)} บาท`
          : 'ไม่มีข้อมูลราคาขายปัจจุบัน',
    },
    portfolio: {
      summary:
        market.totalGoldWeight > 0
          ? `ถือทองรวม ${market.totalGoldWeight.toFixed(4)} บาท ต้นทุนเฉลี่ย ${market.averageCost.toFixed(2)} บาท/บาททอง`
          : 'ยังไม่มีสถานะทองคำในพอร์ต',
      drawdownPercent: market.profitLossPercentage < 0 ? Math.abs(market.profitLossPercentage) : 0,
      positionSizePercent: round(
        market.currentValue > 0 ? (market.currentValue / (market.currentValue + 50000)) * 100 : 0,
      ),
      averageCostVsPricePercent: round(avgCostVsPrice),
    },
    news: {
      summary: 'รอการสังเคราะห์ข้อมูลข่าวสารและบทวิเคราะห์ตลาด',
      stance: 'UNKNOWN',
      confidence: 0,
    },
  };
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
    const action: RecommendationAction = 'WAIT';
    const why = 'ยังไม่มีราคาล่าสุดเพียงพอสำหรับประเมินคำแนะนำ';
    const risk = 'ไม่สามารถประเมินความเสี่ยงทางการลงทุนเนื่องจากขาดข้อมูลราคาล่าสุด';
    return {
      ...base,
      action,
      why,
      confidence: 50,
      risk,
      evidence: buildEvidence(market),
      reasons: [why],
      recommendedAmount: 0,
      sellPartialPercent: null,
    };
  }

  if (
    market.totalGoldWeight > 0 &&
    market.profitLossPercentage >= settings.profitTargetPercent * 1.5
  ) {
    const action: RecommendationAction = 'STRONG_SELL';
    const why = `กำไรพอร์ต ${market.profitLossPercentage.toFixed(2)}% สูงเกินเป้าหมาย ${settings.profitTargetPercent.toFixed(2)}% อย่างมาก`;
    const risk = 'ความเสี่ยงราคาย้อนตัวจากระดับสูงสุด ให้พิจารณาล็อกกำไรโดยเร็ว';
    return {
      ...base,
      action,
      why,
      confidence: 95,
      risk,
      evidence: buildEvidence(market),
      reasons: [why, `ขายบางส่วน ${settings.sellPartialPercent}% เพื่อล็อกกำไร`],
      recommendedAmount: 0,
      sellPartialPercent: settings.sellPartialPercent,
    };
  }

  if (market.totalGoldWeight > 0 && market.profitLossPercentage >= settings.profitTargetPercent) {
    const action: RecommendationAction = 'SELL';
    const why = `กำไรพอร์ต ${market.profitLossPercentage.toFixed(2)}% ถึงเป้าหมาย ${settings.profitTargetPercent.toFixed(2)}%`;
    const risk = 'ความเสี่ยงตลาดย้อนตัวจากบริเวณแนวต้าน ให้แบ่งขายทำกำไรบางส่วน';
    return {
      ...base,
      action,
      why,
      confidence: 88,
      risk,
      evidence: buildEvidence(market),
      reasons: [why, `พิจารณาลดความเสี่ยงโดยขายบางส่วน ${settings.sellPartialPercent}%`],
      recommendedAmount: 0,
      sellPartialPercent: settings.sellPartialPercent,
    };
  }

  if (
    settings.stopBuyAbovePrice !== null &&
    market.currentSellPrice >= settings.stopBuyAbovePrice
  ) {
    const action: RecommendationAction = 'HOLD';
    const why = `ราคาขายปัจจุบัน ${market.currentSellPrice.toFixed(2)} บาท ถึงเงื่อนไขหยุดซื้อ ${settings.stopBuyAbovePrice.toFixed(2)} บาท`;
    const risk = 'เสี่ยงติดดอยหากซื้อเพิ่ม ณ ระดับราคาที่สูงเกินเพดานความเสี่ยง';
    return {
      ...base,
      action,
      why,
      confidence: 85,
      risk,
      evidence: buildEvidence(market),
      reasons: [why],
      recommendedAmount: 0,
      sellPartialPercent: null,
    };
  }

  if (!market.nextBuyLevel) {
    const action: RecommendationAction = market.totalGoldWeight > 0 ? 'HOLD' : 'WAIT';
    const why = 'ยังไม่มี Buy Level ที่รอดำเนินการตามแผนแบ่งไม้';
    const risk = 'ไม่มีกรอบราคาเป้าหมาย อาจทำให้เกิดอารมณ์ในการตัดสินใจซื้อขาย';
    return {
      ...base,
      action,
      why,
      confidence: 75,
      risk,
      evidence: buildEvidence(market),
      reasons: [why],
      recommendedAmount: 0,
      sellPartialPercent: null,
    };
  }

  if (market.currentSellPrice <= market.nextBuyLevel.targetPrice) {
    if (recommendedAmount <= 0 || recommendedAmount < market.nextBuyLevel.investmentAmount) {
      const action: RecommendationAction = 'WAIT';
      const why = `ราคาลดลงผ่าน Buy Level #${market.nextBuyLevel.sequence} แล้ว แต่เงินสดสำรองไม่เพียงพอ`;
      const risk = 'เสี่ยงขาดสภาพคล่องทางการเงินหากฝืนใช้เงินสำรองฉุกเฉิน';
      return {
        ...base,
        action,
        why,
        confidence: 80,
        risk,
        evidence: buildEvidence(market),
        reasons: [why, 'ต้องรักษาเงินสำรองขั้นต่ำตามเกณฑ์บริหารความเสี่ยง'],
        recommendedAmount,
        sellPartialPercent: null,
      };
    }

    const action: RecommendationAction =
      market.profitLossPercentage <= -5.0 || market.totalGoldWeight === 0 ? 'STRONG_BUY' : 'BUY';
    const why = `ราคาลดลงผ่าน Buy Level #${market.nextBuyLevel.sequence} ที่ ${market.nextBuyLevel.targetPrice.toFixed(2)} บาท`;
    const risk = 'ความเสี่ยงราคายังอาจปรับตัวลงต่อในระยะสั้น ควรทยอยสะสมตามแผนแบ่งไม้';
    return {
      ...base,
      action,
      why,
      confidence: action === 'STRONG_BUY' ? 90 : 82,
      risk,
      evidence: buildEvidence(market),
      reasons: [why, `เงินสดหลังกันสำรองเพียงพอสำหรับแผน ${market.nextBuyLevel.planName}`],
      recommendedAmount,
      sellPartialPercent: null,
    };
  }

  const action: RecommendationAction = market.totalGoldWeight > 0 ? 'HOLD' : 'WAIT';
  const why = `ราคายังไม่ถึง Buy Level #${market.nextBuyLevel.sequence} ที่ ${market.nextBuyLevel.targetPrice.toFixed(2)} บาท`;
  const risk = 'การรีบซื้อก่อนถึงเป้าหมายจะเสียเปรียบด้านต้นทุนเฉลี่ยและสัดส่วนเงินสด';
  return {
    ...base,
    action,
    why,
    confidence: 78,
    risk,
    evidence: buildEvidence(market),
    reasons: [
      why,
      market.totalGoldWeight > 0
        ? 'ถือสถานะเดิมและรอระดับราคาตามแผน'
        : 'รอจังหวะตามแผนก่อนเริ่มลงทุน',
    ],
    recommendedAmount: 0,
    sellPartialPercent: null,
  };
}

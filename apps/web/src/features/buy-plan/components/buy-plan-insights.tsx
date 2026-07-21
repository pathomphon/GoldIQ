'use client';

import type { TechnicalAnalysis } from '@/features/analysis/types';
import type { Recommendation } from '@/features/recommendation/types';

interface Props {
  readonly recommendation?: Recommendation | null;
  readonly analysis?: TechnicalAnalysis | null;
}

export function BuyPlanInsights({ recommendation, analysis }: Props) {
  const action = recommendation?.action ?? 'BUY';
  const rsi = analysis?.rsi ?? 45;
  const newsStance = recommendation?.marketIntelligence?.brief?.stance ?? 'NEUTRAL';

  // Format action text & badge style
  let actionLabel = 'แนะนำ: ทยอยสะสมแบบแบ่งไม้ (DCA BUY)';
  let actionVariant = 'buy';
  if (action === 'STRONG_BUY' || action === 'BUY') {
    actionLabel = 'แนะนำ: จังหวะเข้าซื้อสะสม (BUY)';
    actionVariant = 'buy';
  } else if (action === 'WAIT' || action === 'HOLD') {
    actionLabel = 'แนะนำ: รอย่อตัวเข้าทดสอบแนวรับ (WAIT)';
    actionVariant = 'wait';
  } else if (action === 'SELL' || action === 'STRONG_SELL' || action === 'REVIEW_PROFIT' || action === 'SELL_PARTIAL') {
    actionLabel = 'แนะนำ: พิจารณาทอยขายทำกำไรบางส่วน (TAKE PROFIT)';
    actionVariant = 'sell';
  }

  // Determine RSI status
  let rsiLabel = 'โซนปกติ (Neutral)';
  let rsiVariant = 'neutral';
  if (rsi < 35) {
    rsiLabel = 'ขายมากเกินไป (Oversold - โซนซื้อสะสม)';
    rsiVariant = 'buy';
  } else if (rsi > 65) {
    rsiLabel = 'ซื้อมากเกินไป (Overbought - ระวังการย่อตัว)';
    rsiVariant = 'sell';
  }

  // Determine trend status from EMA
  const ema20 = analysis?.ema?.['20'];
  const ema50 = analysis?.ema?.['50'];
  let trendLabel = 'แนวโน้มขาขึ้น (Uptrend)';
  if (ema20 && ema50 && ema20 < ema50) {
    trendLabel = 'แนวโน้มพักตัว / ขาลง (Downtrend/Correction)';
  }

  // News stance label
  const newsLabel =
    newsStance === 'BULLISH'
      ? 'ข่าวสารเชิงบวก (Bullish)'
      : newsStance === 'BEARISH'
      ? 'ข่าวสารเชิงลบ (Bearish)'
      : 'ข่าวสารเป็นกลาง (Neutral)';

  return (
    <div className="insights-panel" aria-label="Insight แนวทางการลงทุน">
      <div className="insights-header">
        <div className="insights-title-box">
          <span className="insights-eyebrow">MARKET INSIGHT & STRATEGY</span>
          <h3 className="insights-heading">แนวทางการลงทุนและกลยุทธ์แบ่งไม้</h3>
        </div>
        <div className={`action-badge action-badge--${actionVariant}`}>
          <span className="action-badge__dot" />
          <strong>{actionLabel}</strong>
        </div>
      </div>

      <div className="indicators-row">
        <div className="indicator-chip">
          <span className="indicator-chip__label">RSI (14)</span>
          <strong className={`indicator-chip__value text-${rsiVariant}`}>
            {rsi.toFixed(1)} — {rsiLabel}
          </strong>
        </div>
        <div className="indicator-chip">
          <span className="indicator-chip__label">แนวโน้มราคา (EMA)</span>
          <strong className="indicator-chip__value">{trendLabel}</strong>
        </div>
        <div className="indicator-chip">
          <span className="indicator-chip__label">ทิศทางข่าวสาร (News)</span>
          <strong className="indicator-chip__value">{newsLabel}</strong>
        </div>
      </div>

      <div className="insights-body">
        <h4 className="insights-subheading">💡 คำแนะนำกลยุทธ์การแบ่งไม้</h4>
        <ul className="insights-list">
          <li>
            <strong>สภาวะตลาดปัจจุบัน:</strong>{' '}
            {recommendation?.why ??
              'ราคาทองคำอยู่ในช่วงพักตัวตามกรอบเทคนิค การวางแผนแบ่งไม้ 3 สเต็ปช่วยลดต้นทุนเฉลี่ยและจำกัดความเสี่ยงได้ดี'}
          </li>
          <li>
            <strong>ระยะห่างแต่ละไม้:</strong> แนะนำวางระยะห่างเป้าหมายซื้อย่อตัวประมาณ 150 – 350 บาทต่อไม้ เพื่อกระจายจุดเข้าซื้อตามแนวรับสำคัญ
          </li>
          <li>
            <strong>วินัยการลงทุน:</strong> ไม่ควรรวมเงินลงทุนไว้ในไม้เดียว และควรเปิดแจ้งเตือน Alert เมื่อราคาแตะเป้าเพื่อตัดสินใจเข้าซื้อตามแผน
          </li>
        </ul>
      </div>
    </div>
  );
}

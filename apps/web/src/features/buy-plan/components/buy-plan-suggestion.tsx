'use client';

import type { TechnicalAnalysis } from '@/features/analysis/types';
import type { GoldPriceSnapshot, GoldProductCode } from '@/features/gold-price/types';

interface Props {
  readonly currentPrices?: readonly GoldPriceSnapshot[];
  readonly productCode: GoldProductCode;
  readonly analysis?: TechnicalAnalysis | null;
  readonly onApplySuggestions?: (
    levels: readonly { targetPrice: number; investmentAmount: number }[],
  ) => void;
}

const moneyFormatter = new Intl.NumberFormat('th-TH', { maximumFractionDigits: 0 });

function roundToFifty(val: number): number {
  return Math.round(val / 50) * 50;
}

export function BuyPlanSuggestion({
  currentPrices,
  productCode,
  analysis,
  onApplySuggestions,
}: Props) {
  const currentSnapshot = currentPrices?.find((p) => p.productCode === productCode);
  const sellPrice = currentSnapshot?.sellPrice ?? 63400;
  const buyPrice = currentSnapshot?.buyPrice ?? 63300;

  // Calculate buy suggestions based on support levels or default dips
  const sup1 = analysis?.support?.[0] ? Math.min(analysis.support[0], sellPrice - 100) : sellPrice - 150;
  const sup2 = analysis?.support?.[1] ? Math.min(analysis.support[1], sellPrice - 300) : sellPrice - 350;
  const sup3 = analysis?.support?.[2] ? Math.min(analysis.support[2], sellPrice - 500) : sellPrice - 600;

  const buyTargets = [
    {
      sequence: 1,
      targetPrice: roundToFifty(sup1),
      discount: sellPrice - roundToFifty(sup1),
      investmentAmount: 20000,
      label: 'ไม้ #1 (ย่อตัวเล็กน้อย)',
    },
    {
      sequence: 2,
      targetPrice: roundToFifty(sup2),
      discount: sellPrice - roundToFifty(sup2),
      investmentAmount: 15000,
      label: 'ไม้ #2 (แนวรับหลัก)',
    },
    {
      sequence: 3,
      targetPrice: roundToFifty(sup3),
      discount: sellPrice - roundToFifty(sup3),
      investmentAmount: 15000,
      label: 'ไม้ #3 (ย่อลึกตั้งรับฐาน)',
    },
  ];

  const res1 = analysis?.resistance?.[0] ? Math.max(analysis.resistance[0], buyPrice + 200) : buyPrice + 300;
  const res2 = analysis?.resistance?.[1] ? Math.max(analysis.resistance[1], buyPrice + 500) : buyPrice + 600;
  const res3 = analysis?.resistance?.[2] ? Math.max(analysis.resistance[2], buyPrice + 800) : buyPrice + 1000;

  const sellTargets = [
    {
      sequence: 1,
      targetPrice: roundToFifty(res1),
      gain: roundToFifty(res1) - buyPrice,
      label: 'เป้าสั้น (+0.7%)',
    },
    {
      sequence: 2,
      targetPrice: roundToFifty(res2),
      gain: roundToFifty(res2) - buyPrice,
      label: 'เป้ากลาง (+1.4%)',
    },
    {
      sequence: 3,
      targetPrice: roundToFifty(res3),
      gain: roundToFifty(res3) - buyPrice,
      label: 'เป้ารันเทรนด์ (+2.3%)',
    },
  ];

  function handleApply() {
    if (onApplySuggestions) {
      onApplySuggestions(
        buyTargets.map((t) => ({
          targetPrice: t.targetPrice,
          investmentAmount: t.investmentAmount,
        })),
      );
    }
  }

  return (
    <div className="suggestion-panel" aria-label="คำแนะนำราคาซื้อขายตามราคาทองปัจจุบัน">
      <div className="suggestion-header">
        <div>
          <span className="suggestion-badge">ราคาแนะนำ ณ ปัจจุบัน</span>
          <h3 className="suggestion-title">
            {currentSnapshot?.productName ?? 'ทองคำแท่ง 96.5%'}
          </h3>
        </div>
        <div className="suggestion-price-box">
          <div className="price-item">
            <span className="price-label">ราคาขายออก</span>
            <strong className="price-value text-buy">
              ฿{moneyFormatter.format(sellPrice)}
            </strong>
          </div>
          <div className="price-item">
            <span className="price-label">ราคารับซื้อ</span>
            <strong className="price-value text-sell">
              ฿{moneyFormatter.format(buyPrice)}
            </strong>
          </div>
        </div>
      </div>

      <div className="suggestion-grid">
        <div className="suggestion-column">
          <h4 className="column-heading">
            <span className="icon">📉</span> ราคาซื้อแนะนำ 3 ไม้ (Buy Targets)
          </h4>
          <div className="target-list">
            {buyTargets.map((item) => (
              <div key={item.sequence} className="target-card target-card--buy">
                <div className="target-card__info">
                  <strong>{item.label}</strong>
                  <small>ลดลง ฿{moneyFormatter.format(item.discount)} จากราคาขายปัจจุบัน</small>
                </div>
                <div className="target-card__price">
                  <span>เป้าซื้อ</span>
                  <strong>฿{moneyFormatter.format(item.targetPrice)}</strong>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="suggestion-column">
          <h4 className="column-heading">
            <span className="icon">📈</span> เป้าหมายราคาขายทำกำไร (Sell Targets)
          </h4>
          <div className="target-list">
            {sellTargets.map((item) => (
              <div key={item.sequence} className="target-card target-card--sell">
                <div className="target-card__info">
                  <strong>{item.label}</strong>
                  <small>บวกกำไร ฿{moneyFormatter.format(item.gain)} จากราคารับซื้อ</small>
                </div>
                <div className="target-card__price">
                  <span>เป้าขาย</span>
                  <strong>฿{moneyFormatter.format(item.targetPrice)}</strong>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {onApplySuggestions ? (
        <div className="suggestion-footer">
          <button
            type="button"
            className="button button--secondary button--apply-suggestions"
            onClick={handleApply}
          >
            ⚡ นำราคาซื้อแนะนำ 3 ไม้ใส่ในฟอร์ม
          </button>
        </div>
      ) : null}
    </div>
  );
}

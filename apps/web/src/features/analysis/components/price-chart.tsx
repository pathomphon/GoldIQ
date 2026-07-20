'use client';

import { useState } from 'react';

import type { TechnicalAnalysis } from '@/features/analysis/types';

interface PriceChartProps {
  readonly samples: TechnicalAnalysis['samples'];
  readonly support?: readonly number[];
  readonly resistance?: readonly number[];
}

const money = new Intl.NumberFormat('th-TH', {
  maximumFractionDigits: 0,
});

function calculateY(value: number, min: number, max: number): number {
  const range = Math.max(max - min, 1);
  return 92 - ((value - min) / range) * 80;
}

function points(values: readonly number[], min: number, max: number): string {
  return values
    .map((value, index) => {
      const x = values.length === 1 ? 50 : (index / (values.length - 1)) * 100;
      const y = calculateY(value, min, max);
      return `${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(' ');
}

interface SrLabelItem {
  id: string;
  type: 'support' | 'resistance';
  price: number;
  label: string;
  targetY: number;
  labelY: number;
}

function computeAdjustedLabels(
  support: readonly number[],
  resistance: readonly number[],
  showSupport: boolean,
  showResistance: boolean,
  min: number,
  max: number,
): SrLabelItem[] {
  const items: SrLabelItem[] = [];

  if (showResistance) {
    resistance.forEach((price, idx) => {
      const targetY = calculateY(price, min, max);
      items.push({
        id: `res-${price}-${idx}`,
        type: 'resistance',
        price,
        label: `R${idx + 1}: ฿${money.format(price)}`,
        targetY,
        labelY: targetY - 0.5,
      });
    });
  }

  if (showSupport) {
    support.forEach((price, idx) => {
      const targetY = calculateY(price, min, max);
      items.push({
        id: `sup-${price}-${idx}`,
        type: 'support',
        price,
        label: `S${idx + 1}: ฿${money.format(price)}`,
        targetY,
        labelY: targetY + 2.5,
      });
    });
  }

  items.sort((a, b) => a.targetY - b.targetY);

  const minGap = 4.2;

  for (let i = 1; i < items.length; i++) {
    const prev = items[i - 1];
    const curr = items[i];
    if (prev && curr && curr.labelY < prev.labelY + minGap) {
      curr.labelY = prev.labelY + minGap;
    }
  }

  const lastItem = items.at(-1);
  if (lastItem && lastItem.labelY > 96) {
    lastItem.labelY = 96;
    for (let i = items.length - 2; i >= 0; i--) {
      const curr = items[i];
      const next = items[i + 1];
      if (curr && next && curr.labelY > next.labelY - minGap) {
        curr.labelY = next.labelY - minGap;
      }
    }
  }

  items.forEach((item) => {
    item.labelY = Math.max(4, Math.min(96, item.labelY));
  });

  return items;
}

export function PriceChart({ samples, support = [], resistance = [] }: PriceChartProps) {
  const [showSupport, setShowSupport] = useState(true);
  const [showResistance, setShowResistance] = useState(true);

  if (samples.length < 2) {
    return <div className="analysis-empty">กำลังสะสมข้อมูลสำหรับกราฟราคา</div>;
  }

  const activeSupports = showSupport ? support : [];
  const activeResistances = showResistance ? resistance : [];

  const sampleValues = samples.flatMap((sample) => [sample.buyPrice, sample.sellPrice]);
  const allValues = [...sampleValues, ...activeSupports, ...activeResistances];
  const min = Math.min(...allValues);
  const max = Math.max(...allValues);

  const srLabels = computeAdjustedLabels(
    support,
    resistance,
    showSupport,
    showResistance,
    min,
    max,
  );

  return (
    <div className="price-chart-container">
      <div className="price-chart-toolbar">
        <label className="toggle-label">
          <input
            type="checkbox"
            checked={showSupport}
            onChange={(e) => setShowSupport(e.target.checked)}
          />
          <span className="badge badge--support">แนวรับ ({support.length})</span>
        </label>
        <label className="toggle-label">
          <input
            type="checkbox"
            checked={showResistance}
            onChange={(e) => setShowResistance(e.target.checked)}
          />
          <span className="badge badge--resistance">แนวต้าน ({resistance.length})</span>
        </label>
      </div>

      <div className="price-chart">
        <svg
          aria-label="กราฟประวัติราคารับซื้อและขายออก พร้อมแนวรับ-แนวต้าน"
          role="img"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
        >
          {[20, 40, 60, 80].map((y) => (
            <line key={y} className="chart-grid" x1="0" x2="100" y1={y} y2={y} />
          ))}

          {/* Support and Resistance Lines */}
          {srLabels.map((item) => (
            <g key={item.id} className={`sr-group sr-group--${item.type}`}>
              <line
                className={`chart-line--sr chart-line--${item.type}`}
                x1="0"
                x2="100"
                y1={item.targetY}
                y2={item.targetY}
                strokeDasharray="2,2"
              />
              {Math.abs(item.labelY - item.targetY) > 1.5 && (
                <line
                  className="chart-line--sr-connector"
                  x1="97.5"
                  x2="97.5"
                  y1={item.targetY}
                  y2={item.labelY}
                />
              )}
              <rect
                x="76"
                y={item.labelY - 2.1}
                width="23.5"
                height="3.2"
                rx="0.6"
                className={`chart-sr-bg chart-sr-bg--${item.type}`}
              />
              <text
                x="98.5"
                y={item.labelY}
                textAnchor="end"
                className={`chart-sr-text chart-sr-text--${item.type}`}
              >
                {item.label}
              </text>
            </g>
          ))}

          {/* Sell Price Polyline */}
          <polyline
            className="chart-line chart-line--sell"
            points={points(
              samples.map((s) => s.sellPrice),
              min,
              max,
            )}
          />

          {/* Buy Price Polyline */}
          <polyline
            className="chart-line chart-line--buy"
            points={points(
              samples.map((s) => s.buyPrice),
              min,
              max,
            )}
          />
        </svg>

        <div className="chart-legend">
          <span className="sell">ขายออก</span>
          <span className="buy">รับซื้อ</span>
          {showResistance && <span className="resistance-legend">แนวต้าน (R)</span>}
          {showSupport && <span className="support-legend">แนวรับ (S)</span>}
        </div>
      </div>
    </div>
  );
}

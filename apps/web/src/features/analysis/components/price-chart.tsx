import type { TechnicalAnalysis } from '@/features/analysis/types';

interface PriceChartProps {
  readonly samples: TechnicalAnalysis['samples'];
}

function points(values: readonly number[], min: number, max: number): string {
  const range = Math.max(max - min, 1);
  return values
    .map((value, index) => {
      const x = values.length === 1 ? 50 : (index / (values.length - 1)) * 100;
      const y = 92 - ((value - min) / range) * 80;
      return `${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(' ');
}

export function PriceChart({ samples }: PriceChartProps) {
  if (samples.length < 2) {
    return <div className="analysis-empty">กำลังสะสมข้อมูลสำหรับกราฟราคา</div>;
  }
  const values = samples.flatMap((sample) => [sample.buyPrice, sample.sellPrice]);
  const min = Math.min(...values);
  const max = Math.max(...values);

  return (
    <div className="price-chart">
      <svg
        aria-label="กราฟประวัติราคารับซื้อและขายออก"
        role="img"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        {[20, 40, 60, 80].map((y) => (
          <line key={y} className="chart-grid" x1="0" x2="100" y1={y} y2={y} />
        ))}
        <polyline
          className="chart-line chart-line--sell"
          points={points(
            samples.map((s) => s.sellPrice),
            min,
            max,
          )}
        />
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
      </div>
    </div>
  );
}

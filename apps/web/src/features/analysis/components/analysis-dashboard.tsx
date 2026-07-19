import Link from 'next/link';

import type { AnalysisResult } from '@/features/analysis/types';
import type { GoldProductCode } from '@/features/gold-price/types';
import { PriceChart } from './price-chart';

const products: readonly [GoldProductCode, string][] = [
  ['GOLD_BAR_965', 'ทองคำแท่ง 96.5%'],
  ['GOLD_ORNAMENT_965', 'ทองรูปพรรณ 96.5%'],
  ['GOLD_9999', 'ทองคำ 99.99%'],
];
const ranges = [
  ['Intraday', 100],
  ['7 วัน', 200],
  ['30 วัน', 300],
  ['3 เดือน', 400],
  ['1 ปี', 500],
] as const;
const money = new Intl.NumberFormat('th-TH', { maximumFractionDigits: 2 });

function value(value: number | null): string {
  return value === null ? 'ข้อมูลยังไม่เพียงพอ' : money.format(value);
}

export function AnalysisDashboard({
  result,
  productCode,
  limit,
}: {
  readonly result: AnalysisResult;
  readonly productCode: GoldProductCode;
  readonly limit: number;
}) {
  const analysis = result.data;
  const latest = analysis?.samples.at(-1);
  return (
    <div className="app-shell">
      <header className="topbar">
        <Link className="wordmark" href="/">
          <span>Gold</span>IQ
        </Link>
        <nav aria-label="Primary navigation">
          <Link className="nav-link" href="/">
            Gold prices
          </Link>
          <Link className="nav-link" href="/portfolio">
            Portfolio
          </Link>
          <Link className="nav-link" href="/buy-plan">
            Buy plan
          </Link>
          <Link aria-current="page" className="nav-link nav-link--active" href="/analysis">
            Analysis
          </Link>
          <Link className="nav-link" href="/recommendation">
            Recommendation
          </Link>
          <Link className="nav-link" href="/system-status">
            System status
          </Link>
        </nav>
      </header>
      <main className="analysis-page">
        <section>
          <h1>วิเคราะห์ราคาทอง</h1>
          <p className="lede">ติดตามแนวโน้มจากประวัติราคาจริง พร้อมตัวชี้วัดทางเทคนิค</p>
          <div className="analysis-controls">
            <div>
              {products.map(([code, label]) => (
                <Link
                  className={code === productCode ? 'control-active' : ''}
                  href={`/analysis?product=${code}&limit=${limit}`}
                  key={code}
                >
                  {label}
                </Link>
              ))}
            </div>
            <div>
              {ranges.map(([label, count]) => (
                <Link
                  className={count === limit ? 'control-active' : ''}
                  href={`/analysis?product=${productCode}&limit=${count}`}
                  key={label}
                >
                  {label}
                </Link>
              ))}
            </div>
          </div>
          {result.error || !analysis ? (
            <div className="notice notice--error">{result.error}</div>
          ) : (
            <>
              <div className="analysis-latest">
                <span>ล่าสุด {analysis.samples.length} จุดข้อมูล</span>
                <strong>ขายออก ฿{latest ? money.format(latest.sellPrice) : '—'}</strong>
                <strong className="buy-text">
                  รับซื้อ ฿{latest ? money.format(latest.buyPrice) : '—'}
                </strong>
              </div>
              <PriceChart samples={analysis.samples} />
              <div className="indicator-table">
                <article>
                  <h2>EMA</h2>
                  <strong>{value(analysis.ema['20'])}</strong>
                  <p>EMA 20 · EMA 50 {value(analysis.ema['50'])}</p>
                </article>
                <article>
                  <h2>RSI</h2>
                  <strong>{value(analysis.rsi)}</strong>
                  <p>โซนต่ำกว่า 30 / สูงกว่า 70</p>
                </article>
                <article>
                  <h2>MACD</h2>
                  <strong>{value(analysis.macd?.value ?? null)}</strong>
                  <p>Signal {value(analysis.macd?.signal ?? null)}</p>
                </article>
                <article>
                  <h2>Support</h2>
                  <strong>
                    {analysis.support.map((item) => money.format(item)).join(' · ') || '—'}
                  </strong>
                  <p>ระดับราคาต่ำจากช่วงข้อมูล</p>
                </article>
                <article>
                  <h2>Resistance</h2>
                  <strong>
                    {analysis.resistance.map((item) => money.format(item)).join(' · ') || '—'}
                  </strong>
                  <p>ระดับราคาสูงจากช่วงข้อมูล</p>
                </article>
              </div>
            </>
          )}
        </section>
      </main>
      <footer>
        <span>Phase 5</span>
        <i />
        <span>Charts &amp; Indicators</span>
      </footer>
    </div>
  );
}

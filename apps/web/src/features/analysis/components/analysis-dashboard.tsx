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
              <PriceChart
                samples={analysis.samples}
                support={analysis.support}
                resistance={analysis.resistance}
              />

              {latest && (analysis.support.length > 0 || analysis.resistance.length > 0) ? (
                <div className="sr-decision-card">
                  <div className="sr-decision-header">
                    <h2>การวิเคราะห์กรอบแนวรับ-แนวต้านเพื่อตัดสินใจซื้อ</h2>
                    <span className="sr-tag">Support & Resistance Decision</span>
                  </div>
                  {(() => {
                    const current = latest.sellPrice;
                    const nearestSupport = analysis.support[0] ?? current;
                    const nearestResistance = analysis.resistance[0] ?? current;
                    const range = Math.max(nearestResistance - nearestSupport, 1);
                    const positionPercent = Math.min(
                      100,
                      Math.max(0, ((current - nearestSupport) / range) * 100),
                    );

                    let zoneText = 'ราคาอยู่กึ่งกลางกรอบแนวรับ-แนวต้าน (Consolidation Zone)';
                    let zoneStatus = 'neutral';
                    if (positionPercent <= 30) {
                      zoneText =
                        'ราคาเข้าใกล้แนวรับ (Buy Opportunity Zone) — เหมาะแก่การเข้าซื้อตามแผนแบ่งไม้';
                      zoneStatus = 'buy-zone';
                    } else if (positionPercent >= 70) {
                      zoneText =
                        'ราคาเข้าใกล้แนวต้าน (Caution Zone) — ควรชะลอการซื้อหรือทบทวนเป้าทำกำไร';
                      zoneStatus = 'caution-zone';
                    }

                    return (
                      <div className="sr-decision-body">
                        <div className={`sr-status-banner sr-status-banner--${zoneStatus}`}>
                          <strong>{zoneText}</strong>
                        </div>
                        <div className="sr-range-bar-wrapper">
                          <div className="sr-range-labels">
                            <span className="support-label">
                              แนวรับ S1: ฿{money.format(nearestSupport)}
                            </span>
                            <span className="current-label">
                              ปัจจุบัน: ฿{money.format(current)}
                            </span>
                            <span className="resistance-label">
                              แนวต้าน R1: ฿{money.format(nearestResistance)}
                            </span>
                          </div>
                          <div className="sr-range-track">
                            <div
                              className="sr-range-pin"
                              style={{ left: `${positionPercent}%` }}
                              title={`ตำแหน่งราคาอยู่ที่ ${positionPercent.toFixed(0)}% ของกรอบ`}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              ) : null}

              <div className="indicator-table">
                <article>
                  <h2>EMA</h2>
                  <strong>{value(analysis.ema['20'])}</strong>
                  <p>EMA 20 · EMA 50 {value(analysis.ema['50'])}</p>
                </article>
                <article>
                  <h2>SMA</h2>
                  <strong>{value(analysis.sma?.['20'] ?? null)}</strong>
                  <p>SMA 20 · SMA 50 {value(analysis.sma?.['50'] ?? null)}</p>
                </article>
                <article>
                  <h2>RSI</h2>
                  <strong>{value(analysis.rsi)}</strong>
                  <p>โซนต่ำกว่า 30 (Oversold) / สูงกว่า 70 (Overbought)</p>
                </article>
                <article>
                  <h2>MACD</h2>
                  <strong>{value(analysis.macd?.value ?? null)}</strong>
                  <p>
                    Signal {value(analysis.macd?.signal ?? null)} · Hist{' '}
                    {value(analysis.macd?.histogram ?? null)}
                  </p>
                </article>
                <article>
                  <h2>Bollinger Bands</h2>
                  <strong>
                    {analysis.bollingerBands
                      ? `฿${money.format(analysis.bollingerBands.middle)}`
                      : '—'}
                  </strong>
                  <p>
                    {analysis.bollingerBands
                      ? `Upper ฿${money.format(analysis.bollingerBands.upper)} · Lower ฿${money.format(analysis.bollingerBands.lower)}`
                      : 'ข้อมูลยังไม่เพียงพอ'}
                  </p>
                </article>
                <article>
                  <h2>ATR (14) / Volatility</h2>
                  <strong>{analysis.atr ? `฿${money.format(analysis.atr)}` : '—'}</strong>
                  <p>ส่วนต่างความผันผวนของราคาต่อช่วง</p>
                </article>
                <article>
                  <h2>Pivot Points</h2>
                  <strong>
                    {analysis.pivotPoints
                      ? `Pivot ฿${money.format(analysis.pivotPoints.pivot)}`
                      : '—'}
                  </strong>
                  <p>
                    {analysis.pivotPoints
                      ? `R1 ฿${money.format(analysis.pivotPoints.r1)} · S1 ฿${money.format(analysis.pivotPoints.s1)}`
                      : 'ข้อมูลยังไม่เพียงพอ'}
                  </p>
                </article>
                <article>
                  <h2>Support</h2>
                  <div className="sr-chip-group">
                    {analysis.support.length > 0 ? (
                      analysis.support.map((item, idx) => (
                        <span key={`sup-chip-${idx}`} className="sr-chip sr-chip--support">
                          S{idx + 1}: ฿{money.format(item)}
                        </span>
                      ))
                    ) : (
                      <strong>—</strong>
                    )}
                  </div>
                  <p>ระดับราคาต่ำจากช่วงข้อมูล</p>
                </article>
                <article>
                  <h2>Resistance</h2>
                  <div className="sr-chip-group">
                    {analysis.resistance.length > 0 ? (
                      analysis.resistance.map((item, idx) => (
                        <span key={`res-chip-${idx}`} className="sr-chip sr-chip--resistance">
                          R{idx + 1}: ฿{money.format(item)}
                        </span>
                      ))
                    ) : (
                      <strong>—</strong>
                    )}
                  </div>
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

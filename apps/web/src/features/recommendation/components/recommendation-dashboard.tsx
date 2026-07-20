import Link from 'next/link';

import { MarketBriefPanel } from '@/features/market-intelligence/components/market-brief-panel';
import type { MarketBriefResult } from '@/features/market-intelligence/types';
import type { RecommendationResult } from '@/features/recommendation/types';
import { RiskSettingsForm } from './risk-settings-form';

const money = new Intl.NumberFormat('th-TH', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const ACTION_META: Record<
  string,
  { label: string; copy: string; variant: 'buy' | 'sell' | 'wait' | 'hold' }
> = {
  STRONG_BUY:    { label: 'STRONG BUY',   copy: 'สัญญาณซื้อระดับแรง ราคาลงถึงเป้าหมายและสภาพคล่องพร้อมสมบูรณ์',        variant: 'buy'  },
  BUY:           { label: 'BUY',           copy: 'ถึงระดับซื้อและเงินสดพร้อมตามแผน',                                       variant: 'buy'  },
  WAIT:          { label: 'WAIT',          copy: 'รอเงื่อนไขที่เหมาะสมก่อนดำเนินการ',                                       variant: 'wait' },
  HOLD:          { label: 'HOLD',          copy: 'ถือสถานะเดิมและติดตามระดับราคาถัดไป',                                     variant: 'hold' },
  SELL:          { label: 'SELL',          copy: 'กำไรถึงเป้าหมาย พิจารณาแบ่งขายทำกำไร',                                   variant: 'sell' },
  STRONG_SELL:   { label: 'STRONG SELL',   copy: 'กำไรสูงเกินเป้าหมายอย่างมาก ควรล็อกกำไรทันที',                          variant: 'sell' },
  REVIEW_PROFIT: { label: 'REVIEW PROFIT', copy: 'กำไรใกล้เป้าหมาย ควรทบทวนแผน',                                           variant: 'sell' },
  SELL_PARTIAL:  { label: 'SELL PARTIAL',  copy: 'กำไรถึงเป้าหมาย พิจารณาขายบางส่วน',                                      variant: 'sell' },
};

const EFFECT_LABEL: Record<string, string> = {
  NO_CHANGE:         'ข่าวไม่กระทบคำแนะนำ',
  SUPPORTS:          'ข่าวสนับสนุนสัญญาณ',
  CAUTION:           'ข่าวส่งสัญญาณระวัง',
  LIVE_OVERRIDE_WAIT: 'ข่าวชะลอสัญญาณซื้อ',
};

export function RecommendationDashboard({
  result,
  marketBrief,
}: {
  readonly result: RecommendationResult;
  readonly marketBrief: MarketBriefResult;
}) {
  const rec = result.data;
  const meta = rec ? (ACTION_META[rec.action] ?? { label: rec.action, copy: rec.why ?? '', variant: 'wait' as const }) : null;

  return (
    <div className="app-shell">
      <header className="topbar">
        <Link className="wordmark" href="/">
          <span>Gold</span>IQ
        </Link>
        <nav aria-label="Primary navigation">
          <Link className="nav-link" href="/">Gold prices</Link>
          <Link className="nav-link" href="/portfolio">Portfolio</Link>
          <Link className="nav-link" href="/buy-plan">Buy plan</Link>
          <Link className="nav-link" href="/analysis">Analysis</Link>
          <Link aria-current="page" className="nav-link nav-link--active" href="/recommendation">Recommendation</Link>
          <Link className="nav-link" href="/system-status">System status</Link>
        </nav>
      </header>

      <main className="recommendation-page">
        {/* ── Page header ── */}
        <div className="rec-page-header">
          <div>
            <p className="eyebrow">EXPLAINABLE DECISION ENGINE</p>
            <h1>คำแนะนำการลงทุน</h1>
          </div>
          {rec?.market.observedAt ? (
            <time className="rec-timestamp" dateTime={rec.market.observedAt}>
              อัปเดต{' '}
              {new Intl.DateTimeFormat('th-TH', {
                dateStyle: 'medium',
                timeStyle: 'short',
                timeZone: 'Asia/Bangkok',
              }).format(new Date(rec.market.observedAt))}
            </time>
          ) : null}
        </div>

        {result.error || !rec || !meta ? (
          <div className="notice notice--error" role="alert">
            <strong>ยังสร้างคำแนะนำไม่ได้</strong>
            <span>{result.error}</span>
          </div>
        ) : (
          <div className="rec-layout">

            {/* ── LEFT COLUMN ── */}
            <div className="rec-main">

              {/* Section 1 — Signal Hero */}
              <section className="rec-section" aria-label="สัญญาณหลัก">
                <div className={`rec-signal-card rec-signal-card--${meta.variant}`}>
                  <div className="rec-signal-top">
                    <span className="rec-signal-label">Recommendation Signal</span>
                    {rec.confidence !== undefined && (
                      <span className="rec-confidence-badge">
                        ความมั่นใจ {rec.confidence}%
                      </span>
                    )}
                  </div>
                  <div className={`rec-action-badge rec-action-badge--${meta.variant}`}>
                    {meta.label}
                  </div>
                  <p className="rec-action-copy">{meta.copy}</p>

                  {/* Reasons */}
                  {rec.reasons.length > 0 && (
                    <div className="rec-reasons">
                      <h2 className="rec-section-title">เหตุผลประกอบ</h2>
                      <ul className="rec-reasons-list">
                        {rec.reasons.map((reason) => (
                          <li key={reason}>{reason}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Risk warning */}
                  {rec.risk && (
                    <div className="rec-risk-warning">
                      <span className="rec-risk-label">ความเสี่ยงที่ต้องระวัง</span>
                      <p>{rec.risk}</p>
                    </div>
                  )}
                </div>
              </section>

              {/* Section 2 — Market Intelligence */}
              {rec.marketIntelligence && (
                <section className="rec-section" aria-labelledby="mi-title">
                  <div className="rec-section-header">
                    <p className="eyebrow">MARKET INTELLIGENCE · {rec.marketIntelligence.mode}</p>
                    <h2 id="mi-title" className="rec-section-title">
                      {rec.marketIntelligence.mode === 'LIVE'
                        ? 'Active intelligence live mode'
                        : 'Conservative shadow mode'}
                    </h2>
                    <p className="rec-section-desc">
                      {rec.marketIntelligence.mode === 'LIVE'
                        ? 'ข่าวที่มีความเสี่ยงสูงจะช่วยชะลอคำแนะนำซื้อ (BUY → WAIT) โดยไม่กระทบกฎความเสี่ยงหลัก'
                        : 'ข่าวใช้เป็นสัญญาณประกอบเท่านั้น ไม่เปลี่ยนคำแนะนำหลักหรือกฎความเสี่ยง'}
                    </p>
                  </div>
                  <div className="rec-mi-card">
                    <div className="rec-mi-effect">
                      <span className="rec-mi-effect-dot" data-effect={rec.marketIntelligence.effect} />
                      <span>{EFFECT_LABEL[rec.marketIntelligence.effect] ?? rec.marketIntelligence.effect}</span>
                    </div>
                    <div className="rec-mi-signal-row">
                      <span className="rec-mi-action">{rec.marketIntelligence.baseAction.replace('_', ' ')}</span>
                      <span className="rec-mi-arrow">→</span>
                      <span className="rec-mi-action rec-mi-action--final">
                        {rec.marketIntelligence.mode === 'LIVE'
                          ? rec.marketIntelligence.liveAction.replace('_', ' ')
                          : rec.marketIntelligence.shadowAction.replace('_', ' ')}
                      </span>
                    </div>
                    {rec.marketIntelligence.reasons[0] && (
                      <p className="rec-mi-reason">{rec.marketIntelligence.reasons[0]}</p>
                    )}
                    {rec.marketIntelligence.brief && (
                      <p className="rec-mi-brief-meta">
                        <span className={`brief-stance brief-stance--${rec.marketIntelligence.brief.stance.toLowerCase()}`}>
                          {rec.marketIntelligence.brief.stance}
                        </span>
                        {' '}· confidence {(rec.marketIntelligence.brief.confidence * 100).toFixed(0)}%
                        {rec.marketIntelligence.brief.isStale && ' · ⚠ stale'}
                      </p>
                    )}
                  </div>
                </section>
              )}

              {/* Section 3 — Market Brief */}
              <section className="rec-section" aria-label="ข่าวตลาด">
                <MarketBriefPanel result={marketBrief} />
              </section>
            </div>

            {/* ── RIGHT SIDEBAR ── */}
            <aside className="rec-sidebar">

              {/* Section — Portfolio metrics */}
              <section className="rec-sidebar-card" aria-label="ข้อมูลประกอบคำแนะนำ">
                <h2 className="rec-sidebar-title">ข้อมูลพอร์ตและสภาพคล่อง</h2>
                <dl className="rec-metrics-list">
                  <div className="rec-metric-row">
                    <dt>ราคาขายออกปัจจุบัน</dt>
                    <dd className="rec-metric-number">
                      {rec.market.currentSellPrice === null
                        ? '—'
                        : `฿${money.format(rec.market.currentSellPrice)}`}
                    </dd>
                    <dd className="rec-metric-sub">ทองคำแท่ง 96.5%</dd>
                  </div>
                  <div className="rec-metric-row">
                    <dt>ผลตอบแทนพอร์ต</dt>
                    <dd className={`rec-metric-number ${rec.market.profitLossPercentage >= 0 ? 'rec-metric--up' : 'rec-metric--down'}`}>
                      {rec.market.profitLossPercentage >= 0 ? '+' : ''}{rec.market.profitLossPercentage.toFixed(2)}%
                    </dd>
                    <dd className="rec-metric-sub">เทียบกับต้นทุนรวม</dd>
                  </div>
                  <div className="rec-metric-divider" />
                  <div className="rec-metric-row">
                    <dt>เงินสดที่มีอยู่</dt>
                    <dd className="rec-metric-number">฿{money.format(rec.allocation.availableCash)}</dd>
                    <dd className="rec-metric-sub">สำรอง ฿{money.format(rec.allocation.reservedCash)}</dd>
                  </div>
                  <div className="rec-metric-row">
                    <dt>เงินสดที่จัดสรรได้</dt>
                    <dd className="rec-metric-number">฿{money.format(rec.allocation.deployableCash)}</dd>
                    <dd className="rec-metric-sub">แนะนำใช้ ฿{money.format(rec.recommendedAmount)}</dd>
                  </div>
                  <div className="rec-metric-divider" />
                  <div className="rec-metric-row">
                    <dt>ระดับซื้อถัดไป</dt>
                    <dd className="rec-metric-number">
                      {rec.market.nextBuyLevel
                        ? `฿${money.format(rec.market.nextBuyLevel.targetPrice)}`
                        : '—'}
                    </dd>
                    <dd className="rec-metric-sub">
                      {rec.market.nextBuyLevel
                        ? `${rec.market.nextBuyLevel.planName} · ไม้ ${rec.market.nextBuyLevel.sequence}`
                        : 'ยังไม่มีระดับที่รอซื้อ'}
                    </dd>
                  </div>
                </dl>
              </section>

              {/* Section — Risk settings */}
              <section className="rec-sidebar-card" aria-labelledby="risk-settings-title">
                <h2 id="risk-settings-title" className="rec-sidebar-title">ตั้งค่าความเสี่ยง</h2>
                <RiskSettingsForm settings={rec.settings} />
              </section>
            </aside>
          </div>
        )}
      </main>

      <footer>
        <span>Phase 2</span>
        <i aria-hidden="true" />
        <span>Explainable recommendation engine</span>
      </footer>
    </div>
  );
}

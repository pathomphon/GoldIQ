import Link from 'next/link';

import { MarketBriefPanel } from '@/features/market-intelligence/components/market-brief-panel';
import type { MarketBriefResult } from '@/features/market-intelligence/types';
import type { RecommendationResult } from '@/features/recommendation/types';
import { RiskSettingsForm } from './risk-settings-form';

const money = new Intl.NumberFormat('th-TH', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const actionCopy = {
  BUY: 'ถึงระดับซื้อและเงินสดพร้อมตามแผน',
  WAIT: 'รอเงื่อนไขที่เหมาะสมก่อนดำเนินการ',
  HOLD: 'ถือสถานะเดิมและติดตามระดับราคาถัดไป',
  REVIEW_PROFIT: 'กำไรใกล้เป้าหมาย ควรทบทวนแผน',
  SELL_PARTIAL: 'กำไรถึงเป้าหมาย พิจารณาขายบางส่วน',
} as const;

export function RecommendationDashboard({
  result,
  marketBrief,
}: {
  readonly result: RecommendationResult;
  readonly marketBrief: MarketBriefResult;
}) {
  const recommendation = result.data;
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
          <Link className="nav-link" href="/analysis">
            Analysis
          </Link>
          <Link aria-current="page" className="nav-link nav-link--active" href="/recommendation">
            Recommendation
          </Link>
          <Link className="nav-link" href="/system-status">
            System status
          </Link>
        </nav>
      </header>
      <main className="recommendation-page">
        <div className="recommendation-heading">
          <h1>คำแนะนำการลงทุน</h1>
          {recommendation?.market.observedAt ? (
            <time dateTime={recommendation.market.observedAt}>
              อัปเดตล่าสุด{' '}
              {new Intl.DateTimeFormat('th-TH', {
                dateStyle: 'medium',
                timeStyle: 'short',
                timeZone: 'Asia/Bangkok',
              }).format(new Date(recommendation.market.observedAt))}
            </time>
          ) : null}
        </div>
        {result.error || !recommendation ? (
          <div className="notice notice--error" role="alert">
            <strong>ยังสร้างคำแนะนำไม่ได้</strong>
            <span>{result.error}</span>
          </div>
        ) : (
          <>
            <section
              className={`recommendation-hero action-${recommendation.action.toLowerCase()}`}
            >
              <div>
                <span>Recommendation</span>
                <strong>{recommendation.action}</strong>
                <p>{actionCopy[recommendation.action]}</p>
              </div>
              <div className="recommendation-reasons">
                <h2>เหตุผล</h2>
                <ul>
                  {recommendation.reasons.map((reason) => (
                    <li key={reason}>{reason}</li>
                  ))}
                </ul>
              </div>
            </section>
            <section className="recommendation-metrics" aria-label="ข้อมูลประกอบคำแนะนำ">
              <article>
                <span>ราคาทองขายออกปัจจุบัน</span>
                <strong>
                  {recommendation.market.currentSellPrice === null
                    ? '—'
                    : `฿${money.format(recommendation.market.currentSellPrice)}`}
                </strong>
                <small>ทองคำแท่ง 96.5%</small>
              </article>
              <article>
                <span>ผลตอบแทนพอร์ต</span>
                <strong>{recommendation.market.profitLossPercentage.toFixed(2)}%</strong>
                <small>เทียบกับต้นทุนรวม</small>
              </article>
              <article>
                <span>เงินสดที่มีอยู่</span>
                <strong>฿{money.format(recommendation.allocation.availableCash)}</strong>
                <small>สำรอง ฿{money.format(recommendation.allocation.reservedCash)}</small>
              </article>
              <article>
                <span>เงินสดที่จัดสรรได้</span>
                <strong>฿{money.format(recommendation.allocation.deployableCash)}</strong>
                <small>แนะนำใช้ ฿{money.format(recommendation.recommendedAmount)}</small>
              </article>
              <article>
                <span>ระดับซื้อถัดไป</span>
                <strong>
                  {recommendation.market.nextBuyLevel
                    ? `฿${money.format(recommendation.market.nextBuyLevel.targetPrice)}`
                    : '—'}
                </strong>
                <small>
                  {recommendation.market.nextBuyLevel
                    ? `${recommendation.market.nextBuyLevel.planName} · ไม้ ${recommendation.market.nextBuyLevel.sequence}`
                    : 'ยังไม่มีระดับที่รอซื้อ'}
                </small>
              </article>
            </section>
            <MarketBriefPanel result={marketBrief} />
            <section className="risk-settings" aria-labelledby="risk-settings-title">
              <h2 id="risk-settings-title">ตั้งค่าความเสี่ยง</h2>
              <RiskSettingsForm settings={recommendation.settings} />
            </section>
          </>
        )}
      </main>
    </div>
  );
}

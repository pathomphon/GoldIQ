import Link from 'next/link';

import { BuyPlanManager } from '@/features/buy-plan/components/buy-plan-manager';
import type { BuyPlanDashboardResult } from '@/features/buy-plan/types';

export function BuyPlanDashboard({ result }: Readonly<{ result: BuyPlanDashboardResult }>) {
  const waiting = result.dashboard.plans
    .flatMap((plan) => plan.levels)
    .filter((level) => level.status === 'WAITING').length;
  const triggered = result.dashboard.plans
    .flatMap((plan) => plan.levels)
    .filter((level) => level.status === 'TRIGGERED').length;

  return (
    <div className="app-shell">
      <header className="topbar">
        <Link aria-label="GoldIQ home" className="wordmark" href="/">
          <span>Gold</span>IQ
        </Link>
        <nav aria-label="Primary navigation">
          <Link className="nav-link" href="/">
            Gold prices
          </Link>
          <Link className="nav-link" href="/portfolio">
            Portfolio
          </Link>
          <Link aria-current="page" className="nav-link nav-link--active" href="/buy-plan">
            Buy plan
          </Link>
          <Link className="nav-link" href="/analysis">
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
      <main className="buy-plan-page">
        <section aria-labelledby="buy-plan-title">
          <p className="eyebrow">BUY LEVEL AUTOMATION</p>
          <h1 id="buy-plan-title">แผนแบ่งไม้ซื้อทอง</h1>
          <p className="lede">
            ติดตามราคาขายออกและบันทึก Alert เมื่อราคาถึงเป้าหมาย โดยไม่แจ้งซ้ำในไม้เดิม
          </p>
          {result.error ? (
            <div className="notice notice--error" role="alert">
              <strong>โหลดแผนไม่ได้</strong>
              <span>{result.error}</span>
            </div>
          ) : (
            <>
              <div className="plan-summary">
                <article>
                  <span>แผนทั้งหมด</span>
                  <strong>{result.dashboard.plans.length}</strong>
                </article>
                <article>
                  <span>ไม้ที่รอราคา</span>
                  <strong>{waiting}</strong>
                </article>
                <article>
                  <span>ไม้ที่ Triggered</span>
                  <strong>{triggered}</strong>
                </article>
                <article>
                  <span>Alert history</span>
                  <strong>{result.dashboard.recentAlerts.length}</strong>
                </article>
              </div>
              <BuyPlanManager
                analysis={result.analysis}
                currentPrices={result.currentPrices}
                plans={result.dashboard.plans}
                recommendation={result.recommendation}
              />
              <section className="alert-history" aria-labelledby="alert-history-title">
                <div className="section-heading">
                  <div>
                    <p className="eyebrow">RECENT ALERTS</p>
                    <h2 id="alert-history-title">ประวัติ Alert</h2>
                  </div>
                </div>
                {result.dashboard.recentAlerts.length === 0 ? (
                  <div className="notice">
                    <strong>ยังไม่มี Alert</strong>
                    <span>Event จะแสดงเมื่อราคาขายออกถึงระดับที่รออยู่</span>
                  </div>
                ) : (
                  result.dashboard.recentAlerts.map((alert) => (
                    <article className="alert-row" key={alert.id}>
                      <time dateTime={alert.triggeredAt}>
                        {new Intl.DateTimeFormat('th-TH', {
                          dateStyle: 'medium',
                          timeStyle: 'short',
                          timeZone: 'Asia/Bangkok',
                        }).format(new Date(alert.triggeredAt))}
                      </time>
                      <span>{alert.message}</span>
                      <strong>{alert.deliveryStatus}</strong>
                    </article>
                  ))
                )}
              </section>
            </>
          )}
        </section>
      </main>
      <footer>
        <span>Phase 4</span>
        <i aria-hidden="true" />
        <span>Buy plans & alerts</span>
      </footer>
    </div>
  );
}

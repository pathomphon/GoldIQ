import Link from 'next/link';

import { TransactionManager } from '@/features/portfolio/components/transaction-manager';
import type { PortfolioDashboardResult } from '@/features/portfolio/types';

interface PortfolioDashboardProps {
  readonly result: PortfolioDashboardResult;
}

const currency = new Intl.NumberFormat('th-TH', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function formatCurrency(value: number): string {
  return `฿${currency.format(value)}`;
}

function bangkokLocalInput(date: Date): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Bangkok',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date);
  const value = new Map(parts.map((part) => [part.type, part.value]));
  return `${value.get('year')}-${value.get('month')}-${value.get('day')}T${value.get('hour')}:${value.get('minute')}`;
}

export function PortfolioDashboard({ result }: PortfolioDashboardProps) {
  const { dashboard } = result;
  const profitDirection =
    dashboard.metrics.profitLoss > 0 ? 'up' : dashboard.metrics.profitLoss < 0 ? 'down' : 'neutral';
  const realizedDirection =
    dashboard.metrics.realizedProfitLoss > 0
      ? 'up'
      : dashboard.metrics.realizedProfitLoss < 0
        ? 'down'
        : 'neutral';

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
          <Link aria-current="page" className="nav-link nav-link--active" href="/portfolio">
            Portfolio
          </Link>
          <Link className="nav-link" href="/buy-plan">
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

      <main className="portfolio-page">
        <section aria-labelledby="portfolio-title">
          <p className="eyebrow">PERSONAL GOLD PORTFOLIO</p>
          <h1 id="portfolio-title">พอร์ตทองของคุณ</h1>
          <p className="lede">ต้นทุน น้ำหนัก และกำไรขาดทุนจากราคารับซื้อล่าสุด</p>

          {result.error ? (
            <div className="notice notice--error" role="alert">
              <strong>ไม่สามารถโหลดข้อมูลพอร์ตได้</strong>
              <span>{result.error}</span>
            </div>
          ) : (
            <>
              <div className="portfolio-metrics">
                <article className="metric metric--hero">
                  <span>มูลค่าพอร์ตปัจจุบัน</span>
                  <strong>{formatCurrency(dashboard.metrics.currentValue)}</strong>
                  <small>
                    อ้างอิงราคารับซื้อ
                    {dashboard.valuedAt
                      ? ` · ${new Intl.DateTimeFormat('th-TH', {
                          dateStyle: 'medium',
                          timeStyle: 'short',
                          timeZone: 'Asia/Bangkok',
                        }).format(new Date(dashboard.valuedAt))}`
                      : ''}
                  </small>
                </article>
                <article className="metric">
                  <span>ต้นทุนคงเหลือ</span>
                  <strong>{formatCurrency(dashboard.metrics.totalInvested)}</strong>
                </article>
                <article className="metric">
                  <span>น้ำหนักคงเหลือ</span>
                  <strong>{dashboard.metrics.totalGoldWeight.toFixed(6)}</strong>
                  <small>บาททอง</small>
                </article>
                <article className="metric">
                  <span>ต้นทุนเฉลี่ย / จุดคุ้มทุน</span>
                  <strong>{formatCurrency(dashboard.metrics.averageCost)}</strong>
                  <small>ต่อบาททอง</small>
                </article>
                <article className={`metric metric--${profitDirection}`}>
                  <span>กำไร / ขาดทุนที่ยังไม่รับรู้</span>
                  <strong>{formatCurrency(dashboard.metrics.profitLoss)}</strong>
                  <small>{dashboard.metrics.profitLossPercentage.toFixed(2)}%</small>
                </article>
                <article className={`metric metric--${realizedDirection}`}>
                  <span>กำไร / ขาดทุนที่รับรู้แล้ว</span>
                  <strong>{formatCurrency(dashboard.metrics.realizedProfitLoss)}</strong>
                  <small>{dashboard.metrics.closedLots} ล็อตที่ปิดแล้ว</small>
                </article>
                <article className="metric metric--win-rate">
                  <span>Win Rate</span>
                  <strong>
                    {dashboard.metrics.winRate === null
                      ? '—'
                      : `${dashboard.metrics.winRate.toFixed(2)}%`}
                  </strong>
                  <small>
                    {dashboard.metrics.winRate === null
                      ? 'Win Rate จะแสดงเมื่อมีล็อตที่ขายหมด'
                      : `ชนะ ${dashboard.metrics.winningLots} · แพ้ ${dashboard.metrics.losingLots} · เสมอ ${dashboard.metrics.breakEvenLots}`}
                  </small>
                </article>
                <article className="metric">
                  <span>Max Drawdown</span>
                  <strong>
                    {dashboard.metrics.maxDrawdown !== undefined
                      ? `${dashboard.metrics.maxDrawdown.toFixed(2)}%`
                      : '0.00%'}
                  </strong>
                  <small>จุดลดลงสูงสุดเทียบต้นทุน</small>
                </article>
                <article className="metric">
                  <span>Position Size / Risk Exposure</span>
                  <strong>
                    {dashboard.metrics.positionSizePercentage !== undefined
                      ? `${dashboard.metrics.positionSizePercentage.toFixed(1)}%`
                      : '—'}
                  </strong>
                  <small>
                    Risk Exposure:{' '}
                    {dashboard.metrics.riskExposurePercentage !== undefined
                      ? `${dashboard.metrics.riskExposurePercentage.toFixed(1)}%`
                      : '—'}
                  </small>
                </article>
                <article className="metric">
                  <span>คำแนะนำซื้อ / ขายที่แนะนำ</span>
                  <strong>
                    {dashboard.metrics.suggestedBuyAmount
                      ? `ซื้อ ${formatCurrency(dashboard.metrics.suggestedBuyAmount)}`
                      : '—'}
                  </strong>
                  <small>
                    {dashboard.metrics.suggestedSellAmount
                      ? `ขายทำกำไร ${formatCurrency(dashboard.metrics.suggestedSellAmount)}`
                      : 'ถือสถานะไว้'}
                  </small>
                </article>
              </div>

              <TransactionManager
                defaultPurchasedAt={bangkokLocalInput(new Date())}
                transactions={dashboard.transactions}
              />
            </>
          )}
        </section>
      </main>

      <footer>
        <span>Phase 8</span>
        <i aria-hidden="true" />
        <span>Portfolio management</span>
      </footer>
    </div>
  );
}

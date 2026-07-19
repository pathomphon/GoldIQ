import Link from 'next/link';

import { StatusIcon } from '@/features/system-status/components/status-icon';
import type { DependencyCheck, SystemReadiness } from '@/features/system-status/types';

const serviceLabels: Record<DependencyCheck['name'], { label: string; endpoint: string }> = {
  api: { label: 'API', endpoint: '/health/liveness' },
  postgresql: { label: 'PostgreSQL', endpoint: '/health/readiness' },
  redis: { label: 'Redis', endpoint: '/health/readiness' },
};

interface SystemStatusProps {
  readonly readiness: SystemReadiness;
}

function formatTimestamp(timestamp: string): string {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) {
    return 'Unavailable';
  }

  return new Intl.DateTimeFormat('en', {
    dateStyle: 'medium',
    timeStyle: 'medium',
    timeZone: 'UTC',
  }).format(date);
}

function statusLabel(status: DependencyCheck['status']): string {
  if (status === 'up') {
    return 'Healthy';
  }
  if (status === 'down') {
    return 'Unavailable';
  }
  return 'Unknown';
}

export function SystemStatus({ readiness }: SystemStatusProps) {
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
          <Link className="nav-link" href="/buy-plan">
            Buy plan
          </Link>
          <Link className="nav-link" href="/analysis">
            Analysis
          </Link>
          <Link className="nav-link" href="/recommendation">
            Recommendation
          </Link>
          <Link aria-current="page" className="nav-link nav-link--active" href="/system-status">
            System status
          </Link>
        </nav>
      </header>

      <main className="status-page">
        <section aria-labelledby="page-title">
          <h1 id="page-title">System foundation</h1>
          <p className="lede">Live readiness from the GoldIQ API.</p>

          <div className="status-table" role="table" aria-label="System dependency readiness">
            <div className="status-row status-row--header" role="row">
              <span role="columnheader">Service</span>
              <span role="columnheader">Status</span>
              <span role="columnheader">Latency</span>
              <span role="columnheader">Last updated</span>
            </div>

            {readiness.checks.map((check) => {
              const service = serviceLabels[check.name];
              return (
                <div className="status-row" key={check.name} role="row">
                  <div className="service-cell" role="cell">
                    <span className="service-mark" aria-hidden="true">
                      {service.label.slice(0, 1)}
                    </span>
                    <span>
                      <strong>{service.label}</strong>
                      <small>{service.endpoint}</small>
                    </span>
                  </div>
                  <div className={`health health--${check.status}`} role="cell">
                    <StatusIcon status={check.status} />
                    <span>{statusLabel(check.status)}</span>
                  </div>
                  <span role="cell">
                    {check.latencyMs === null ? '—' : `${check.latencyMs} ms`}
                  </span>
                  <time dateTime={readiness.checkedAt} role="cell">
                    {formatTimestamp(readiness.checkedAt)}
                  </time>
                  {check.message ? <p className="service-message">{check.message}</p> : null}
                </div>
              );
            })}
          </div>
        </section>
      </main>

      <footer>
        <span>Phase 2</span>
        <i aria-hidden="true" />
        <span>Ready to build on</span>
      </footer>
    </div>
  );
}

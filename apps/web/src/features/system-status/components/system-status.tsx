import Link from 'next/link';

import type { NewsAgentStatusResult } from '@/features/market-intelligence/types';
import { StatusIcon } from '@/features/system-status/components/status-icon';
import type { DependencyCheck, SystemReadiness } from '@/features/system-status/types';

const serviceLabels: Record<DependencyCheck['name'], { label: string; description: string; endpoint: string }> = {
  api:        { label: 'API Server',  description: 'GoldIQ REST API liveness',     endpoint: '/health/liveness'   },
  postgresql: { label: 'PostgreSQL',  description: 'Database connectivity',         endpoint: '/health/readiness'  },
  redis:      { label: 'Redis',       description: 'Cache & scheduler lock store',  endpoint: '/health/readiness'  },
};

interface SystemStatusProps {
  readonly readiness: SystemReadiness;
  readonly agentStatus?: NewsAgentStatusResult;
}

function formatTimestamp(timestamp: string): string {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return 'Unavailable';
  return new Intl.DateTimeFormat('en', {
    dateStyle: 'medium',
    timeStyle: 'medium',
    timeZone: 'UTC',
  }).format(date);
}

function statusLabel(status: DependencyCheck['status']): string {
  if (status === 'up')   return 'Healthy';
  if (status === 'down') return 'Unavailable';
  return 'Unknown';
}

/** Derives overall health from all checks */
function overallHealth(checks: readonly DependencyCheck[]): 'healthy' | 'degraded' | 'down' {
  if (checks.every((c) => c.status === 'up')) return 'healthy';
  if (checks.some((c) => c.status === 'up'))  return 'degraded';
  return 'down';
}

export function SystemStatus({ readiness, agentStatus }: SystemStatusProps) {
  const agent = agentStatus?.data;
  const health = overallHealth(readiness.checks);

  const healthLabel  = { healthy: 'All systems operational', degraded: 'Partial outage', down: 'System down' }[health];
  const healthVariant: 'up' | 'degraded' | 'down' = health === 'healthy' ? 'up' : health;

  return (
    <div className="app-shell">
      <header className="topbar">
        <Link aria-label="GoldIQ home" className="wordmark" href="/">
          <span>Gold</span>IQ
        </Link>
        <nav aria-label="Primary navigation">
          <Link className="nav-link" href="/">Gold prices</Link>
          <Link className="nav-link" href="/portfolio">Portfolio</Link>
          <Link className="nav-link" href="/buy-plan">Buy plan</Link>
          <Link className="nav-link" href="/analysis">Analysis</Link>
          <Link className="nav-link" href="/recommendation">Recommendation</Link>
          <Link aria-current="page" className="nav-link nav-link--active" href="/system-status">System status</Link>
        </nav>
      </header>

      <main className="status-page">

        {/* ── Page header ── */}
        <div className="sys-page-header">
          <div>
            <p className="eyebrow">INFRASTRUCTURE MONITOR</p>
            <h1>System Status</h1>
            <p className="lede">Live readiness and agent health for GoldIQ services.</p>
          </div>
          {/* Overall health banner */}
          <div className={`sys-health-banner sys-health-banner--${healthVariant}`}>
            <span className="sys-health-dot" />
            <span className="sys-health-label">{healthLabel}</span>
            <time className="sys-health-time" dateTime={readiness.checkedAt}>
              Checked {formatTimestamp(readiness.checkedAt)} UTC
            </time>
          </div>
        </div>

        {/* ── Section 1: Core Infrastructure ── */}
        <section className="sys-section" aria-labelledby="infra-title">
          <div className="sys-section-header">
            <div>
              <h2 id="infra-title" className="sys-section-title">Core Infrastructure</h2>
              <p className="sys-section-desc">API server, database, and cache health checks.</p>
            </div>
            <span className={`sys-overall-badge sys-overall-badge--${healthVariant}`}>
              {readiness.checks.filter((c) => c.status === 'up').length} / {readiness.checks.length} healthy
            </span>
          </div>

          <div className="sys-table" role="table" aria-label="System dependency readiness">
            <div className="sys-row sys-row--header" role="row">
              <span role="columnheader">Service</span>
              <span role="columnheader">Status</span>
              <span role="columnheader">Latency</span>
              <span role="columnheader">Endpoint</span>
            </div>

            {readiness.checks.map((check) => {
              const svc = serviceLabels[check.name];
              return (
                <div className="sys-row" key={check.name} role="row">
                  <div className="sys-service-cell" role="cell">
                    <span className="sys-service-mark" aria-hidden="true">
                      {svc.label[0]}
                    </span>
                    <span className="sys-service-info">
                      <strong>{svc.label}</strong>
                      <small>{svc.description}</small>
                    </span>
                  </div>
                  <div className={`sys-health sys-health--${check.status}`} role="cell">
                    <StatusIcon status={check.status} />
                    <span>{statusLabel(check.status)}</span>
                  </div>
                  <span className="sys-latency" role="cell">
                    {check.latencyMs === null ? '—' : `${check.latencyMs} ms`}
                  </span>
                  <code className="sys-endpoint" role="cell">{svc.endpoint}</code>
                  {check.message ? (
                    <p className="sys-message" role="cell">{check.message}</p>
                  ) : null}
                </div>
              );
            })}
          </div>
        </section>

        {/* ── Section 2: News Agent & AI Provider ── */}
        {agent ? (
          <section className="sys-section" aria-labelledby="agent-title">
            <div className="sys-section-header">
              <div>
                <h2 id="agent-title" className="sys-section-title">News Agent &amp; AI Provider</h2>
                <p className="sys-section-desc">
                  ระบบดึงข่าวอัตโนมัติ (Scheduler) และการเชื่อมต่อ AI Provider
                </p>
              </div>
            </div>

            <div className="sys-table">
              <div className="sys-row sys-row--header">
                <span>Sub-Agent / Provider</span>
                <span>Status</span>
                <span>Details</span>
                <span>Info</span>
              </div>

              {/* News Collector */}
              <div className="sys-row">
                <div className="sys-service-cell">
                  <span className="sys-service-mark">N</span>
                  <span className="sys-service-info">
                    <strong>News Collector</strong>
                    <small>ดึงข่าวการเงินและสินค้าโภคภัณฑ์</small>
                  </span>
                </div>
                <div className={`sys-health sys-health--${agent.newsScheduler.enabled ? 'up' : 'down'}`}>
                  <StatusIcon status={agent.newsScheduler.enabled ? 'up' : 'down'} />
                  <span>{agent.newsScheduler.enabled ? 'Active' : 'Disabled'}</span>
                </div>
                <span className="sys-detail">Cron: <code>{agent.newsScheduler.cron}</code></span>
                <span className="sys-detail">Lock TTL: {agent.newsScheduler.lockTtlMs / 1000}s</span>
              </div>

              {/* AI Research Agent */}
              <div className="sys-row">
                <div className="sys-service-cell">
                  <span className="sys-service-mark">A</span>
                  <span className="sys-service-info">
                    <strong>AI Research Agent</strong>
                    <small>วิเคราะห์ข่าวและสร้าง Market Brief</small>
                  </span>
                </div>
                <div className={`sys-health sys-health--${agent.researchAgentScheduler.enabled ? 'up' : 'down'}`}>
                  <StatusIcon status={agent.researchAgentScheduler.enabled ? 'up' : 'down'} />
                  <span>{agent.researchAgentScheduler.enabled ? 'Active' : 'Disabled'}</span>
                </div>
                <span className="sys-detail">Cron: <code>{agent.researchAgentScheduler.cron}</code></span>
                <span className="sys-detail">Lock TTL: {agent.researchAgentScheduler.lockTtlMs / 1000}s</span>
              </div>

              {/* AI Provider */}
              <div className="sys-row">
                <div className="sys-service-cell">
                  <span className="sys-service-mark">AI</span>
                  <span className="sys-service-info">
                    <strong>Provider: {agent.provider.activeProvider.toUpperCase()}</strong>
                    <small>Model: {agent.provider.model}</small>
                  </span>
                </div>
                <div
                  className={`sys-health sys-health--${
                    agent.provider.ollamaStatus === 'UP' || agent.provider.openAiConfigured ? 'up' : 'down'
                  }`}
                >
                  <StatusIcon
                    status={
                      agent.provider.ollamaStatus === 'UP' || agent.provider.openAiConfigured ? 'up' : 'down'
                    }
                  />
                  <span>
                    {agent.provider.activeProvider === 'ollama'
                      ? agent.provider.ollamaStatus === 'UP'
                        ? 'Ollama Connected'
                        : 'Ollama Disconnected'
                      : agent.provider.openAiConfigured
                        ? 'OpenAI Configured'
                        : 'API Key Missing'}
                  </span>
                </div>
                <span className="sys-detail">
                  {agent.provider.activeProvider === 'ollama'
                    ? agent.provider.ollamaLatencyMs !== null
                      ? `${agent.provider.ollamaLatencyMs} ms`
                      : 'Latency: —'
                    : 'Cloud API'}
                </span>
                <span className="sys-detail">
                  {agent.provider.activeProvider === 'ollama'
                    ? `Ver: ${agent.provider.ollamaVersion ?? '—'}`
                    : 'OpenAI GPT'}
                  {agent.provider.ollamaMessage ? ` · ${agent.provider.ollamaMessage}` : ''}
                </span>
              </div>
            </div>
          </section>
        ) : null}

        {/* ── Section 3: Phase Legend ── */}
        <section className="sys-section sys-legend-section" aria-label="Phase legend">
          <div className="sys-legend">
            <div className="sys-legend-item sys-legend-item--up">
              <StatusIcon status="up" />
              <span>Healthy — Service responding within SLA</span>
            </div>
            <div className="sys-legend-item sys-legend-item--down">
              <StatusIcon status="down" />
              <span>Unavailable — Service unreachable or error</span>
            </div>
            <div className="sys-legend-item sys-legend-item--unknown">
              <StatusIcon status="unknown" />
              <span>Unknown — Check not yet executed</span>
            </div>
          </div>
        </section>

      </main>

      <footer>
        <span>Phase 2</span>
        <i aria-hidden="true" />
        <span>Infrastructure monitoring</span>
      </footer>
    </div>
  );
}

import type { ArticleAnalysis } from '@/features/market-intelligence/types';

interface ArticleAnalysisCardProps {
  readonly analysis: ArticleAnalysis;
}

function stanceColor(stance: ArticleAnalysis['goldImpact']): string {
  if (stance === 'BULLISH') return '#10b981';
  if (stance === 'BEARISH') return '#ef4444';
  return '#6b7280';
}

export function ArticleAnalysisCard({ analysis }: ArticleAnalysisCardProps) {
  return (
    <article
      aria-label="Single article analysis result"
      className="card"
      style={{ marginTop: '1rem', borderLeft: `4px solid ${stanceColor(analysis.goldImpact)}` }}
    >
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <span
            style={{
              padding: '0.25rem 0.5rem',
              borderRadius: '4px',
              fontSize: '0.75rem',
              fontWeight: 600,
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              marginRight: '0.5rem',
            }}
          >
            {analysis.category}
          </span>
          <span style={{ fontSize: '0.875rem', color: '#9ca3af' }}>
            Horizon: {analysis.horizon}
          </span>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <span style={{ color: stanceColor(analysis.goldImpact), fontWeight: 600 }}>
            Gold: {analysis.goldImpact}
          </span>
          <span style={{ color: stanceColor(analysis.thaiGoldImpact), fontWeight: 600 }}>
            TH Gold: {analysis.thaiGoldImpact}
          </span>
          <span style={{ fontWeight: 700 }}>
            Score: {analysis.impactScore > 0 ? `+${analysis.impactScore}` : analysis.impactScore}
          </span>
        </div>
      </header>

      <p style={{ marginTop: '0.75rem', fontWeight: 500 }}>{analysis.summaryTh}</p>

      {analysis.facts.length > 0 ? (
        <div style={{ marginTop: '0.75rem' }}>
          <strong style={{ fontSize: '0.875rem', display: 'block', marginBottom: '0.25rem' }}>
            Verifiable Facts:
          </strong>
          <ul style={{ paddingLeft: '1.25rem', fontSize: '0.875rem', margin: 0 }}>
            {analysis.facts.map((fact, index) => (
              <li key={index}>
                {fact.claim} {fact.value ? <strong>({fact.value})</strong> : null}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {analysis.reasons.length > 0 ? (
        <div style={{ marginTop: '0.5rem' }}>
          <strong style={{ fontSize: '0.875rem', display: 'block', marginBottom: '0.25rem' }}>
            Reasons:
          </strong>
          <ul style={{ paddingLeft: '1.25rem', fontSize: '0.875rem', margin: 0 }}>
            {analysis.reasons.map((reason, index) => (
              <li key={index}>{reason}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {analysis.riskFlags.length > 0 ? (
        <div style={{ marginTop: '0.5rem', color: '#f59e0b' }}>
          <strong style={{ fontSize: '0.875rem', display: 'block', marginBottom: '0.25rem' }}>
            Risk Flags / Missing Context:
          </strong>
          <ul style={{ paddingLeft: '1.25rem', fontSize: '0.875rem', margin: 0 }}>
            {analysis.riskFlags.map((flag, index) => (
              <li key={index}>{flag}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </article>
  );
}

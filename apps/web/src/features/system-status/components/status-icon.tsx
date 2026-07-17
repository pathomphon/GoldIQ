import type { DependencyStatus } from '@/features/system-status/types';

interface StatusIconProps {
  readonly status: DependencyStatus;
}

export function StatusIcon({ status }: StatusIconProps) {
  const symbol = status === 'up' ? '✓' : status === 'down' ? '!' : '—';

  return (
    <span aria-hidden="true" className={`status-icon status-icon--${status}`}>
      {symbol}
    </span>
  );
}

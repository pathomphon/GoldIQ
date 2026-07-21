import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { SystemStatus } from './system-status';

describe('SystemStatus', () => {
  it('renders readiness supplied by the API boundary', () => {
    render(
      <SystemStatus
        readiness={{
          status: 'ok',
          checkedAt: '2026-07-17T12:00:00.000Z',
          checks: [
            { name: 'api', status: 'up', latencyMs: 1 },
            { name: 'postgresql', status: 'up', latencyMs: 12 },
            { name: 'redis', status: 'up', latencyMs: 5 },
          ],
        }}
      />,
    );

    expect(screen.getByRole('heading', { name: 'System Status' })).toBeInTheDocument();
    expect(screen.getAllByText('Healthy')).toHaveLength(3);
    expect(screen.getByText('12 ms')).toBeInTheDocument();
  });
});

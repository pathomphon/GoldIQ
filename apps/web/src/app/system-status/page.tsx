import { getNewsAgentStatus } from '@/features/market-intelligence/data/get-news-agent-status';
import { SystemStatus } from '@/features/system-status/components/system-status';
import { getSystemReadiness } from '@/features/system-status/data/get-system-readiness';

export const dynamic = 'force-dynamic';

export default async function SystemStatusPage() {
  const [readiness, agentStatus] = await Promise.all([getSystemReadiness(), getNewsAgentStatus()]);
  return <SystemStatus agentStatus={agentStatus} readiness={readiness} />;
}

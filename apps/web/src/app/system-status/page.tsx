import { SystemStatus } from '@/features/system-status/components/system-status';
import { getSystemReadiness } from '@/features/system-status/data/get-system-readiness';

export const dynamic = 'force-dynamic';

export default async function SystemStatusPage() {
  const readiness = await getSystemReadiness();
  return <SystemStatus readiness={readiness} />;
}

import { Dashboard } from '@/components/dashboard';
import { fetchTickets } from '@/lib/data-access';

export const dynamic = 'force-dynamic';

export default async function Page() {
  const tickets = await fetchTickets();
  return <Dashboard initialTickets={tickets} />;
}

import { useQuery } from '@tanstack/react-query';
import PageHeader from '../components/PageHeader';
import { EmptyState, ErrorState, LoadingState } from '../components/StateViews';
import { clockTime } from '../lib/format';
import { api } from '../services/api';

export default function Audit() {
  const audit = useQuery({ queryKey: ['audit'], queryFn: api.listAudit, refetchInterval: 5000 });

  if (audit.isLoading) return <LoadingState label="Loading audit log…" />;
  if (audit.isError) return <ErrorState message="Could not load the audit log." onRetry={() => audit.refetch()} />;

  const events = audit.data!;

  return (
    <div className="space-y-6 pb-10">
      <PageHeader title="Audit Log" subtitle="Every governance-relevant action is recorded here — timestamp, event, actor, and details." />

      {events.length === 0 ? (
        <EmptyState title="No events yet" description="Run FairFill or advance a simulation to generate audit events." />
      ) : (
        <div className="card overflow-x-auto p-0">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-ink-700 text-[11px] uppercase tracking-wider text-mist-400">
                <th className="px-4 py-3 font-medium">Time</th>
                <th className="px-4 py-3 font-medium">Event</th>
                <th className="px-4 py-3 font-medium">Actor</th>
                <th className="px-4 py-3 font-medium">Details</th>
              </tr>
            </thead>
            <tbody>
              {events.map((e) => (
                <tr key={e.id} className="border-b border-ink-800 last:border-0 align-top">
                  <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-mist-400">
                    {new Date(e.timestamp).toLocaleDateString('en-IN')} {clockTime(e.timestamp)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 font-mono text-xs font-semibold text-signal-teal">{e.event}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-xs text-mist-300">{e.actor}</td>
                  <td className="px-4 py-3 text-xs leading-relaxed text-mist-300">{e.details}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

import { useQuery } from '@tanstack/react-query';
import { ShieldCheck } from 'lucide-react';
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
      <PageHeader
        title="Audit Log"
        subtitle="Every governance-relevant action is recorded here — timestamp, event, actor, and details."
        actions={
          <span className="flex items-center gap-1.5 rounded-full border border-stone-200 bg-stone-50 px-2.5 py-1 text-[11px] font-medium text-stone-500">
            <ShieldCheck size={12} className="text-emerald-500" /> {events.length} events recorded
          </span>
        }
      />

      {events.length === 0 ? (
        <EmptyState title="No events yet" description="Generate an allocation or advance a simulation to produce audit events." />
      ) : (
        <div className="card overflow-x-auto p-0">
          <table className="w-full text-left text-[13px]">
            <thead>
              <tr className="border-b border-stone-200 text-[10.5px] uppercase tracking-wider text-stone-400">
                <th className="px-4 py-3 font-medium">Time</th>
                <th className="px-4 py-3 font-medium">Event</th>
                <th className="px-4 py-3 font-medium">Actor</th>
                <th className="px-4 py-3 font-medium">Details</th>
              </tr>
            </thead>
            <tbody>
              {events.map((e) => (
                <tr key={e.id} className="border-b border-stone-100 align-top last:border-0 hover:bg-stone-50/60">
                  <td className="whitespace-nowrap px-4 py-3 font-mono text-[11px] text-stone-400">
                    {new Date(e.timestamp).toLocaleDateString('en-IN')} {clockTime(e.timestamp)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 font-mono text-[11px] font-semibold text-accent-600">{e.event}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-[12px] text-stone-600">{e.actor}</td>
                  <td className="px-4 py-3 text-[12px] leading-relaxed text-stone-600">{e.details}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

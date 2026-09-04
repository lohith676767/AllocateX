import { useQuery } from '@tanstack/react-query';
import { ShieldCheck } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import { EmptyState, ErrorState, LoadingState } from '../components/StateViews';
import { clockTime } from '../lib/format';
import { api } from '../services/api';

const EVENT_TONE: Record<string, string> = {
  MILESTONE_MISSED: 'bg-rose-500',
  MILESTONE_PAUSED_EXTERNAL: 'bg-amber-500',
  SALVAGE_EVALUATED: 'bg-amber-500',
  REALLOCATION_PROPOSED: 'bg-amber-500',
  REALLOCATION_UNAVAILABLE: 'bg-amber-500',
  REALLOCATION_APPROVED: 'bg-emerald-500',
  REALLOCATION_REJECTED: 'bg-rose-500',
  MILESTONE_COMPLETED: 'bg-emerald-500',
  ALLOCATION_APPROVED: 'bg-emerald-500',
  ALLOCATION_REJECTED: 'bg-rose-500',
  PROJECT_FUNDED: 'bg-emerald-500',
  DEMO_RESET: 'bg-accent-500',
  REGIONAL_ALLOCATION_CREATED: 'bg-accent-500',
  ALLOCATION_PROPOSED: 'bg-accent-500',
};

// Every audit detail string that concerns a specific project names it in
// quotes (the same convention ProjectDetail's own audit tab filters on) — this
// surfaces that name as its own column instead of asking the reader to find
// it inside a sentence. A sentence can ALSO quote a milestone name first
// ('Milestone "X" missed...', 'Evidence ... for milestone "X" on "Y"'), so a
// naive first-quote match would show the milestone where a project is meant —
// these patterns are ordered to prefer the actual project reference, and fall
// through to "no project named" (a milestone-only sentence) rather than guess.
function extractProject(details: string): string | null {
  const movedBetween = /from "([^"]+)" to "([^"]+)"/.exec(details);
  if (movedBetween) return `${movedBetween[1]} → ${movedBetween[2]}`;
  const relational = /(?:\bon|\bfor|clock for) "([^"]+)"/.exec(details);
  if (relational) return relational[1];
  const leading = /^"([^"]+)"/.exec(details);
  if (leading) return leading[1];
  return null;
}

export default function Audit() {
  const audit = useQuery({ queryKey: ['audit'], queryFn: api.listAudit, refetchInterval: 5000 });

  if (audit.isLoading) return <LoadingState label="Loading audit log…" />;
  if (audit.isError) return <ErrorState message="Could not load the audit log." onRetry={() => audit.refetch()} />;

  const events = audit.data!;

  return (
    <div className="space-y-6 pb-10">
      <PageHeader
        title="Audit Log"
        subtitle="Every governance-relevant action is recorded here — timestamp, authenticated actor, event, project, and details."
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
                <th className="px-4 py-3 font-medium">Project</th>
                <th className="px-4 py-3 font-medium">Details</th>
              </tr>
            </thead>
            <tbody>
              {events.map((e) => {
                const project = extractProject(e.details);
                return (
                  <tr key={e.id} className="border-b border-stone-100 align-top last:border-0 hover:bg-stone-50/60">
                    <td className="whitespace-nowrap px-4 py-3 font-mono text-[11px] text-stone-400">
                      {new Date(e.timestamp).toLocaleDateString('en-IN')} {clockTime(e.timestamp)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <span className="inline-flex items-center gap-1.5 font-mono text-[11px] font-semibold text-stone-700">
                        <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${EVENT_TONE[e.event] ?? 'bg-stone-300'}`} />
                        {e.event}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-[12px] text-stone-600">{e.actor}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-[12px] text-stone-600">{project ?? '—'}</td>
                    <td className="px-4 py-3 text-[12px] leading-relaxed text-stone-600">{e.details}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

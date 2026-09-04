import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { ArrowRight, Check, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import StatusBadge from '../components/StatusBadge';
import { ErrorState, LoadingState } from '../components/StateViews';
import { useApiErrorToast, useToast } from '../hooks/useToast';
import { formatINR } from '../lib/format';
import { api } from '../services/api';
import type { ExtractedProposalFields } from '../types';

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

const STATUS_TONE: Record<string, string> = {
  PENDING: 'bg-amber-50 text-amber-700 border-amber-200',
  ACCEPTED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  REJECTED: 'bg-rose-50 text-rose-700 border-rose-200',
};

export default function Inbox() {
  const queryClient = useQueryClient();
  const { push } = useToast();
  const onError = useApiErrorToast();

  const inbox = useQuery({ queryKey: ['proposals', 'inbox'], queryFn: api.listInbox });

  const acceptMutation = useMutation({
    mutationFn: api.acceptProposal,
    onSuccess: (result) => {
      queryClient.invalidateQueries();
      push('success', 'Proposal accepted', `"${result.project.name}" is now a project awaiting the next FairFill run.`);
    },
    onError: (err) => onError(err, 'Accept failed'),
  });

  const rejectMutation = useMutation({
    mutationFn: api.rejectProposal,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proposals', 'inbox'] });
      push('info', 'Proposal rejected', 'The NGO will see this in their submission status.');
    },
    onError: (err) => onError(err, 'Reject failed'),
  });

  if (inbox.isLoading) return <LoadingState label="Loading inbox…" />;
  if (inbox.isError) return <ErrorState message="Could not load the inbox." onRetry={() => inbox.refetch()} />;

  return (
    <div className="space-y-6 pb-10">
      <PageHeader title="Proposal Inbox" subtitle="Funding proposals submitted by NGOs to companies you represent." />

      {inbox.data!.length === 0 && (
        <div className="card p-8 text-center text-[13px] text-stone-500">No proposals received yet.</div>
      )}

      <div className="space-y-3">
        {inbox.data!.map((item) => {
          const extracted: ExtractedProposalFields = JSON.parse(item.proposal.extractedJson);
          return (
            <motion.div key={item.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="card p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-[14.5px] font-semibold text-stone-900">{extracted.name}</h3>
                    <span className={`rounded-full border px-2 py-0.5 text-[10.5px] font-medium ${STATUS_TONE[item.status]}`}>
                      {item.status}
                    </span>
                  </div>
                  <p className="mt-1 text-[12px] text-stone-500">
                    From <strong className="text-stone-700">{item.proposal.ngoUser.ngo?.name ?? item.proposal.ngoUser.name}</strong> ·
                    Sent to {item.company.name} · {item.proposal.filename} · {formatDate(item.createdAt)}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span className="text-[13px] font-semibold tabular-nums text-stone-900">
                    {formatINR(extracted.requestedBudget, { compact: true })}
                  </span>
                </div>
              </div>

              <p className="mt-3 text-[12.5px] leading-relaxed text-stone-600">{extracted.description}</p>

              <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-[11.5px] text-stone-500">
                <span>
                  Domain: <StatusBadge status={extracted.domain} small />
                </span>
                <span>Region: {extracted.regionNameGuess ?? 'NGO home region'}</span>
                <span>Impact units: {extracted.impactUnits.toLocaleString('en-IN')}</span>
              </div>

              <p className="mt-2 text-[11px] italic text-stone-400">{item.proposal.extractionNote}</p>

              {item.status === 'PENDING' && (
                <div className="mt-4 flex gap-2">
                  <button
                    onClick={() => acceptMutation.mutate(item.id)}
                    disabled={acceptMutation.isPending}
                    className="flex items-center gap-1.5 rounded-md bg-emerald-600 px-3 py-1.5 text-[12.5px] font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
                  >
                    <Check size={13} /> Accept
                  </button>
                  <button
                    onClick={() => rejectMutation.mutate(item.id)}
                    disabled={rejectMutation.isPending}
                    className="flex items-center gap-1.5 rounded-md border border-stone-200 px-3 py-1.5 text-[12.5px] font-medium text-stone-600 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700 disabled:opacity-60"
                  >
                    <X size={13} /> Reject
                  </button>
                </div>
              )}

              {item.status === 'ACCEPTED' && (
                <Link
                  to="/"
                  className="mt-4 flex w-fit items-center gap-1.5 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-[12.5px] font-medium text-emerald-700 hover:bg-emerald-100"
                >
                  Now a project — run FairFill to score it <ArrowRight size={13} />
                </Link>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

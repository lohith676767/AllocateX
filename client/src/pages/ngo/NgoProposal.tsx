import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { CheckCircle2, LogOut, Scale, UploadCloud } from 'lucide-react';
import { useRef, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useApiErrorToast, useToast } from '../../hooks/useToast';
import { formatINR } from '../../lib/format';
import { api } from '../../services/api';
import type { ExtractedProposalFields } from '../../types';

const STATUS_TONE: Record<string, string> = {
  PENDING: 'bg-amber-50 text-amber-700 border-amber-200',
  ACCEPTED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  REJECTED: 'bg-rose-50 text-rose-700 border-rose-200',
};

export default function NgoProposal() {
  const { user, logout } = useAuth();
  const queryClient = useQueryClient();
  const { push } = useToast();
  const onError = useApiErrorToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [selectedCompanyIds, setSelectedCompanyIds] = useState<string[]>([]);

  const companies = useQuery({ queryKey: ['companies'], queryFn: api.listCompanies });
  const sent = useQuery({ queryKey: ['proposals', 'sent'], queryFn: api.listSentProposals });

  const submitMutation = useMutation({
    mutationFn: () => api.submitProposal(file!, selectedCompanyIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proposals', 'sent'] });
      push('success', 'Proposal submitted', 'The selected companies can now review it in their inbox.');
      setFile(null);
      setSelectedCompanyIds([]);
      if (fileInputRef.current) fileInputRef.current.value = '';
    },
    onError: (err) => onError(err, 'Submission failed'),
  });

  function toggleCompany(id: string) {
    setSelectedCompanyIds((prev) => (prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]));
  }

  function handleSubmit() {
    if (!file) return push('error', 'Add a file', 'Attach a proposal document (PDF, DOCX, or plain text) first.');
    if (selectedCompanyIds.length === 0) return push('error', 'Select a company', 'Choose at least one company to send this to.');
    submitMutation.mutate();
  }

  return (
    <div className="min-h-screen bg-stone-50">
      <header className="flex items-center justify-between border-b border-stone-200 bg-white px-6 py-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-accent-600 text-white">
            <Scale size={14} strokeWidth={2.2} />
          </div>
          <div className="leading-tight">
            <p className="text-[14px] font-semibold text-stone-900">FairFill</p>
            <p className="text-[10.5px] uppercase tracking-wide text-stone-400">NGO Proposal Portal</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right leading-tight">
            <p className="text-[12.5px] font-medium text-stone-800">{user?.name}</p>
            <p className="text-[11px] text-stone-400">{user?.ngo?.name ?? user?.email}</p>
          </div>
          <button onClick={() => logout()} className="rounded-md p-2 text-stone-400 hover:bg-stone-100 hover:text-stone-700" aria-label="Log out">
            <LogOut size={16} />
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-2xl space-y-6 px-6 py-10">
        <div>
          <h1 className="text-[20px] font-semibold text-stone-900">Submit a funding proposal</h1>
          <p className="mt-1 text-[13px] text-stone-500">
            Upload your proposal document — FairFill reads it and turns it into a structured project brief for the
            companies you select.
          </p>
        </div>

        <div className="card space-y-5 p-6">
          <div>
            <label className="label-caps mb-2 block">1. Proposal document</label>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.docx,.txt,.md"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="hidden"
              id="proposal-file"
            />
            <label
              htmlFor="proposal-file"
              className="flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed border-stone-200 px-4 py-8 text-center transition-colors hover:border-accent-300 hover:bg-accent-50/40"
            >
              <UploadCloud size={22} className="text-stone-400" />
              <span className="text-[13px] font-medium text-stone-700">{file ? file.name : 'Click to choose a file'}</span>
              <span className="text-[11.5px] text-stone-400">PDF, DOCX, or plain text — up to 8MB</span>
            </label>
          </div>

          <div>
            <label className="label-caps mb-2 block">2. Send to</label>
            {companies.isLoading && <p className="text-[12.5px] text-stone-400">Loading companies…</p>}
            <div className="space-y-1.5">
              {companies.data?.map((c) => (
                <label
                  key={c.id}
                  className="flex cursor-pointer items-center gap-2.5 rounded-md border border-stone-200 px-3 py-2 text-[13px] text-stone-700 hover:bg-stone-50"
                >
                  <input
                    type="checkbox"
                    checked={selectedCompanyIds.includes(c.id)}
                    onChange={() => toggleCompany(c.id)}
                    className="h-3.5 w-3.5 accent-accent-600"
                  />
                  {c.name}
                </label>
              ))}
            </div>
          </div>

          <button
            onClick={handleSubmit}
            disabled={submitMutation.isPending}
            className="w-full rounded-md bg-accent-600 px-3.5 py-2.5 text-[13.5px] font-semibold text-white transition-colors hover:bg-accent-700 disabled:opacity-60"
          >
            {submitMutation.isPending ? 'Submitting…' : 'Submit proposal'}
          </button>
        </div>

        <div>
          <h2 className="mb-3 text-[13px] font-semibold text-stone-700">Your submissions</h2>
          {sent.data?.length === 0 && <p className="text-[12.5px] text-stone-400">No proposals submitted yet.</p>}
          <div className="space-y-3">
            {sent.data?.map((p) => {
              const extracted: ExtractedProposalFields = JSON.parse(p.extractedJson);
              return (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="card p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-[13.5px] font-semibold text-stone-900">{extracted.name}</p>
                      <p className="mt-0.5 text-[11.5px] text-stone-400">
                        {p.filename} · {formatINR(extracted.requestedBudget, { compact: true })} requested
                      </p>
                    </div>
                    <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-emerald-500" />
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {p.recipients.map((r) => (
                      <span
                        key={r.id}
                        className={`rounded-full border px-2 py-0.5 text-[11px] font-medium ${STATUS_TONE[r.status]}`}
                      >
                        {r.company.name}: {r.status.toLowerCase()}
                      </span>
                    ))}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { CheckCircle2, LogOut, Scale, Search, UploadCloud } from 'lucide-react';
import { useMemo, useRef, useState } from 'react';
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

const DOMAINS = ['HEALTHCARE', 'WATER_SANITATION', 'EDUCATION'];

export default function NgoProposal() {
  const { user, logout } = useAuth();
  const queryClient = useQueryClient();
  const { push } = useToast();
  const onError = useApiErrorToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<'upload' | 'review'>('upload');
  const [filename, setFilename] = useState('');
  const [fields, setFields] = useState<ExtractedProposalFields | null>(null);
  const [selectedCompanyIds, setSelectedCompanyIds] = useState<string[]>([]);
  const [companySearch, setCompanySearch] = useState('');

  const companies = useQuery({ queryKey: ['companies'], queryFn: api.listCompanies });
  const sent = useQuery({ queryKey: ['proposals', 'sent'], queryFn: api.listSentProposals });

  const filteredCompanies = useMemo(() => {
    const list = companies.data ?? [];
    if (!companySearch.trim()) return list;
    return list.filter((c) => c.name.toLowerCase().includes(companySearch.trim().toLowerCase()));
  }, [companies.data, companySearch]);

  const previewMutation = useMutation({
    mutationFn: (file: File) => api.previewProposal(file),
    onSuccess: (result) => {
      setFilename(result.filename);
      setFields(result.extracted);
      setStep('review');
    },
    onError: (err) => onError(err, 'Could not read this document'),
  });

  const submitMutation = useMutation({
    mutationFn: () => api.submitProposal(filename, fields!, selectedCompanyIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proposals', 'sent'] });
      push('success', 'Proposal submitted', 'The selected companies can now review it in their inbox.');
      resetForm();
    },
    onError: (err) => onError(err, 'Submission failed'),
  });

  function resetForm() {
    setStep('upload');
    setFilename('');
    setFields(null);
    setSelectedCompanyIds([]);
    setCompanySearch('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  function handleFileChosen(file: File | undefined) {
    if (!file) return;
    previewMutation.mutate(file);
  }

  function toggleCompany(id: string) {
    setSelectedCompanyIds((prev) => (prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]));
  }

  function updateField<K extends keyof ExtractedProposalFields>(key: K, value: ExtractedProposalFields[K]) {
    setFields((prev) => (prev ? { ...prev, [key]: value } : prev));
  }

  function handleSubmit() {
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
            Upload your proposal document — FairFill reads it into a structured brief you can review and correct
            before it goes to any company.
          </p>
        </div>

        {step === 'upload' && (
          <div className="card p-6">
            <label className="label-caps mb-2 block">1. Proposal document</label>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.docx,.txt,.md"
              onChange={(e) => handleFileChosen(e.target.files?.[0])}
              className="hidden"
              id="proposal-file"
            />
            <label
              htmlFor="proposal-file"
              className="flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed border-stone-200 px-4 py-8 text-center transition-colors hover:border-accent-300 hover:bg-accent-50/40"
            >
              <UploadCloud size={22} className="text-stone-400" />
              <span className="text-[13px] font-medium text-stone-700">
                {previewMutation.isPending ? 'Reading document…' : 'Click to choose a file'}
              </span>
              <span className="text-[11.5px] text-stone-400">PDF, DOCX, or plain text — up to 8MB</span>
            </label>
          </div>
        )}

        {step === 'review' && fields && (
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="card space-y-5 p-6">
            <div className="flex items-center justify-between">
              <label className="label-caps block">2. Review extracted details</label>
              <span className="text-[11px] text-stone-400">from {filename}</span>
            </div>
            <p className="-mt-3 text-[11.5px] italic text-stone-500">{fields.note}</p>

            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-[11.5px] font-medium text-stone-600">Project name</label>
                <input
                  value={fields.name}
                  onChange={(e) => updateField('name', e.target.value)}
                  className="w-full rounded-md border border-stone-200 px-3 py-2 text-[13px] outline-none focus:border-accent-400 focus:ring-2 focus:ring-accent-100"
                />
              </div>
              <div>
                <label className="mb-1 block text-[11.5px] font-medium text-stone-600">Description</label>
                <textarea
                  value={fields.description}
                  onChange={(e) => updateField('description', e.target.value)}
                  rows={3}
                  className="w-full resize-none rounded-md border border-stone-200 px-3 py-2 text-[13px] outline-none focus:border-accent-400 focus:ring-2 focus:ring-accent-100"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-[11.5px] font-medium text-stone-600">Domain</label>
                  <select
                    value={fields.domain}
                    onChange={(e) => updateField('domain', e.target.value)}
                    className="w-full rounded-md border border-stone-200 px-3 py-2 text-[13px] outline-none focus:border-accent-400 focus:ring-2 focus:ring-accent-100"
                  >
                    {DOMAINS.map((d) => (
                      <option key={d} value={d}>
                        {d.replace('_', ' ')}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-[11.5px] font-medium text-stone-600">Region (optional)</label>
                  <input
                    value={fields.regionNameGuess ?? ''}
                    onChange={(e) => updateField('regionNameGuess', e.target.value || null)}
                    placeholder="Defaults to your NGO's region"
                    className="w-full rounded-md border border-stone-200 px-3 py-2 text-[13px] outline-none placeholder:text-stone-400 focus:border-accent-400 focus:ring-2 focus:ring-accent-100"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-[11.5px] font-medium text-stone-600">Requested budget (₹)</label>
                  <input
                    type="number"
                    value={fields.requestedBudget}
                    onChange={(e) => updateField('requestedBudget', Number(e.target.value))}
                    className="w-full rounded-md border border-stone-200 px-3 py-2 text-[13px] tabular-nums outline-none focus:border-accent-400 focus:ring-2 focus:ring-accent-100"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[11.5px] font-medium text-stone-600">Impact units / beneficiaries</label>
                  <input
                    type="number"
                    value={fields.impactUnits}
                    onChange={(e) => updateField('impactUnits', Number(e.target.value))}
                    className="w-full rounded-md border border-stone-200 px-3 py-2 text-[13px] tabular-nums outline-none focus:border-accent-400 focus:ring-2 focus:ring-accent-100"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="label-caps mb-2 block">3. Send to</label>
              <div className="relative mb-2">
                <Search size={13} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-400" />
                <input
                  value={companySearch}
                  onChange={(e) => setCompanySearch(e.target.value)}
                  placeholder="Search companies…"
                  className="w-full rounded-md border border-stone-200 py-1.5 pl-8 pr-3 text-[12.5px] outline-none placeholder:text-stone-400 focus:border-accent-400 focus:ring-2 focus:ring-accent-100"
                />
              </div>
              <div className="max-h-44 space-y-1.5 overflow-y-auto">
                {filteredCompanies.length === 0 && <p className="px-1 text-[12px] text-stone-400">No companies match "{companySearch}".</p>}
                {filteredCompanies.map((c) => (
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

            <div className="flex gap-2">
              <button
                onClick={resetForm}
                className="rounded-md border border-stone-200 px-3.5 py-2.5 text-[13px] font-medium text-stone-600 hover:bg-stone-100"
              >
                Start over
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitMutation.isPending}
                className="flex-1 rounded-md bg-accent-600 px-3.5 py-2.5 text-[13.5px] font-semibold text-white transition-colors hover:bg-accent-700 disabled:opacity-60"
              >
                {submitMutation.isPending ? 'Submitting…' : 'Submit proposal'}
              </button>
            </div>
          </motion.div>
        )}

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

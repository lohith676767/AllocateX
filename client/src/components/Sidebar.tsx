import {
  Activity,
  ClipboardList,
  FileImage,
  Layers,
  LayoutDashboard,
  ListTree,
  Map,
  RefreshCcw,
  Repeat,
  ShieldCheck,
} from 'lucide-react';
import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { useApiErrorToast, useToast } from '../hooks/useToast';

const NAV_ITEMS = [
  { to: '/', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/allocations', label: 'Allocations', icon: Layers },
  { to: '/regions', label: 'Regions', icon: Map },
  { to: '/projects', label: 'Projects', icon: ListTree },
  { to: '/simulation', label: 'Simulation', icon: Activity },
  { to: '/reallocations', label: 'Reallocations', icon: Repeat },
  { to: '/evidence', label: 'Evidence', icon: FileImage },
  { to: '/audit', label: 'Audit Log', icon: ClipboardList },
];

export default function Sidebar() {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const queryClient = useQueryClient();
  const { push } = useToast();
  const onError = useApiErrorToast();

  const resetMutation = useMutation({
    mutationFn: api.resetDemo,
    onSuccess: () => {
      queryClient.invalidateQueries();
      push('success', 'Demo reset', 'Scenario restored to its seeded state.');
      setConfirmOpen(false);
    },
    onError: (err) => onError(err, 'Reset failed'),
  });

  return (
    <aside className="flex h-screen w-60 shrink-0 flex-col border-r border-ink-700/70 bg-ink-900">
      <div className="flex items-center gap-2.5 px-5 py-6">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-signal-teal to-signal-blue">
          <ShieldCheck size={17} className="text-ink-950" strokeWidth={2.5} />
        </div>
        <div>
          <p className="text-sm font-bold tracking-tight text-mist-100">FairFill</p>
          <p className="text-[10px] uppercase tracking-widest text-mist-400">CSR Allocation Engine</p>
        </div>
      </div>

      <nav className="flex-1 space-y-0.5 px-3">
        {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-signal-teal/10 text-signal-teal'
                  : 'text-mist-300 hover:bg-ink-800 hover:text-mist-100'
              }`
            }
          >
            <Icon size={16} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-ink-700/70 p-3">
        <button
          onClick={() => setConfirmOpen(true)}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-ink-600 px-3 py-2 text-xs font-medium text-mist-300 transition-colors hover:border-signal-rose/40 hover:text-signal-rose"
        >
          <RefreshCcw size={13} />
          Reset Demo
        </button>
        <p className="mt-3 px-1 text-[10px] leading-relaxed text-mist-400">
          Decision-support only. FairFill proposes — a human always approves before funds move.
        </p>
      </div>

      {confirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/70 backdrop-blur-sm">
          <div className="card w-full max-w-sm p-5">
            <h3 className="text-sm font-semibold text-mist-100">Reset the entire demo?</h3>
            <p className="mt-2 text-xs leading-relaxed text-mist-400">
              This restores all regions, projects, allocations, milestones and the audit log to their original seeded
              state. This cannot be undone.
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setConfirmOpen(false)}
                className="rounded-lg px-3 py-1.5 text-xs font-medium text-mist-300 hover:bg-ink-800"
              >
                Cancel
              </button>
              <button
                onClick={() => resetMutation.mutate()}
                disabled={resetMutation.isPending}
                className="rounded-lg bg-signal-rose px-3 py-1.5 text-xs font-semibold text-ink-950 disabled:opacity-60"
              >
                {resetMutation.isPending ? 'Resetting…' : 'Reset Demo'}
              </button>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}

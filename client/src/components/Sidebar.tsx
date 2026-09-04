import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Activity,
  ClipboardList,
  FileCheck2,
  Inbox as InboxIcon,
  Layers,
  LayoutGrid,
  LogOut,
  Map,
  RefreshCcw,
  Repeat,
  ScanEye,
  Upload,
} from 'lucide-react';
import { useRef, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';
import { useApiErrorToast, useToast } from '../hooks/useToast';

interface NavItem {
  to: string;
  label: string;
  icon: typeof LayoutGrid;
  end?: boolean;
}

const OVERVIEW: NavItem = { to: '/', label: 'Overview', icon: LayoutGrid, end: true };

const GROUPS: { label: string; items: NavItem[] }[] = [
  {
    label: 'Allocate',
    items: [
      { to: '/allocations', label: 'Allocations', icon: Layers },
      { to: '/regions', label: 'Regions', icon: Map },
    ],
  },
  {
    label: 'Monitor',
    items: [
      { to: '/projects', label: 'Projects', icon: ScanEye },
      { to: '/simulation', label: 'Simulation', icon: Activity },
    ],
  },
  {
    label: 'Govern',
    items: [
      { to: '/reallocations', label: 'Reallocations', icon: Repeat },
      { to: '/evidence', label: 'Evidence', icon: FileCheck2 },
      { to: '/audit', label: 'Audit Log', icon: ClipboardList },
      { to: '/inbox', label: 'Proposal Inbox', icon: InboxIcon },
    ],
  },
];

function NavRow({ item }: { item: NavItem }) {
  const Icon = item.icon;
  return (
    <NavLink
      to={item.to}
      end={item.end}
      className={({ isActive }) =>
        `group flex items-center gap-2.5 rounded-md px-2.5 py-[7px] text-[13px] font-medium transition-colors ${
          isActive ? 'bg-accent-50 text-accent-700' : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900'
        }`
      }
    >
      {({ isActive }) => (
        <>
          <Icon size={15} strokeWidth={2} className={isActive ? 'text-accent-600' : 'text-stone-400 group-hover:text-stone-600'} />
          {item.label}
        </>
      )}
    </NavLink>
  );
}

export default function Sidebar() {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const queryClient = useQueryClient();
  const { push } = useToast();
  const onError = useApiErrorToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user, logout } = useAuth();

  const dashboard = useQuery({ queryKey: ['dashboard'], queryFn: api.getDashboard });

  const resetMutation = useMutation({
    mutationFn: api.resetDemo,
    onSuccess: () => {
      queryClient.invalidateQueries();
      push('success', 'Demo reset', 'Scenario restored to its seeded state.');
      setConfirmOpen(false);
    },
    onError: (err) => onError(err, 'Reset failed'),
  });

  const importMutation = useMutation({
    mutationFn: api.importData,
    onSuccess: (result) => {
      queryClient.invalidateQueries();
      push('success', 'Import complete', `Added ${result.regions} region(s), ${result.ngos} NGO(s), ${result.projects} project(s).`);
    },
    onError: (err) => onError(err, 'Import failed'),
  });

  async function handleFileChosen(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const payload = JSON.parse(await file.text());
      importMutation.mutate(payload);
    } catch {
      push('error', 'Import failed', 'That file is not valid JSON.');
    }
  }

  const engineReady = dashboard.data?.fairFillHasRun;

  return (
    <aside className="flex h-screen w-[232px] shrink-0 flex-col border-r border-stone-200 bg-white">
      <div className="flex items-center gap-2.5 px-5 pb-5 pt-6">
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-accent-600 text-[13px] font-bold text-white">
          F
        </div>
        <div className="min-w-0 leading-tight">
          <p className="text-[14px] font-semibold tracking-tight text-stone-900">FairFill</p>
          <p className="text-[10px] font-medium uppercase tracking-wider text-stone-400">CSR Intelligence</p>
        </div>
      </div>

      <div className="flex items-center gap-2 border-y border-stone-100 bg-stone-50/60 px-5 py-2.5">
        <div className="min-w-0 flex-1 leading-tight">
          <p className="truncate text-[12px] font-medium text-stone-800">{user?.name}</p>
          <p className="truncate text-[10.5px] text-stone-400">{user?.companies?.[0]?.name ?? user?.email}</p>
        </div>
        <button onClick={() => logout()} aria-label="Log out" className="shrink-0 rounded-md p-1.5 text-stone-400 hover:bg-stone-100 hover:text-stone-700">
          <LogOut size={14} />
        </button>
      </div>

      <nav className="flex-1 space-y-5 overflow-y-auto px-3 pb-4">
        <div className="space-y-0.5">
          <NavRow item={OVERVIEW} />
        </div>
        {GROUPS.map((group) => (
          <div key={group.label}>
            <p className="mb-1.5 px-2.5 text-[10.5px] font-semibold uppercase tracking-wider text-stone-400">{group.label}</p>
            <div className="space-y-0.5">
              {group.items.map((item) => (
                <NavRow key={item.to} item={item} />
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t border-stone-200 px-4 py-3.5">
        <div className="flex items-center gap-2 px-1 text-[11.5px] text-stone-500">
          <span className={`h-1.5 w-1.5 rounded-full ${engineReady ? 'bg-emerald-500' : 'bg-stone-300'}`} />
          {engineReady ? 'Allocation engine operational' : 'Awaiting first allocation run'}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={handleFileChosen}
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={importMutation.isPending}
          className="flex w-full items-center justify-center gap-1.5 rounded-md border border-stone-200 px-3 py-[7px] text-[12px] font-medium text-stone-600 transition-colors hover:border-accent-200 hover:bg-accent-50 hover:text-accent-700 disabled:opacity-60"
        >
          <Upload size={12} />
          {importMutation.isPending ? 'Importing…' : 'Import Data'}
        </button>

        <button
          onClick={() => setConfirmOpen(true)}
          className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-md border border-stone-200 px-3 py-[7px] text-[12px] font-medium text-stone-600 transition-colors hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700"
        >
          <RefreshCcw size={12} />
          Reset Demo
        </button>
        <p className="mt-2.5 px-1 text-[10.5px] leading-relaxed text-stone-400">
          Decision-support only. FairFill proposes — a human always approves before funds move.
        </p>
      </div>

      {confirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/40 backdrop-blur-[2px]">
          <div className="card w-full max-w-sm p-5 shadow-popover">
            <h3 className="text-[14px] font-semibold text-stone-900">Reset the entire demo?</h3>
            <p className="mt-2 text-[12.5px] leading-relaxed text-stone-500">
              This restores all regions, projects, allocations, milestones and the audit log to their original seeded
              state. This cannot be undone.
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setConfirmOpen(false)}
                className="rounded-md px-3 py-1.5 text-[12.5px] font-medium text-stone-600 hover:bg-stone-100"
              >
                Cancel
              </button>
              <button
                onClick={() => resetMutation.mutate()}
                disabled={resetMutation.isPending}
                className="rounded-md bg-rose-600 px-3 py-1.5 text-[12.5px] font-semibold text-white hover:bg-rose-700 disabled:opacity-60"
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

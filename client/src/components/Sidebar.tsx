import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import {
  Activity,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  FileCheck2,
  Inbox as InboxIcon,
  Layers,
  LayoutGrid,
  LogOut,
  Map,
  Menu,
  RefreshCcw,
  Repeat,
  ScanEye,
  Upload,
  X,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Logo, { LogoMark } from './Logo';
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

const COLLAPSE_KEY = 'fairfill_sidebar_collapsed';

/** Small hover-triggered tooltip used only in the collapsed rail, where labels have no room. */
function RailTooltip({ show, children }: { show: boolean; children: React.ReactNode }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, x: -4 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -4 }}
          transition={{ duration: 0.12 }}
          className="pointer-events-none absolute left-full top-1/2 z-50 ml-2 -translate-y-1/2 whitespace-nowrap rounded-md bg-navy-950 px-2.5 py-1.5 text-[12px] font-medium text-white shadow-popover"
          role="tooltip"
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function NavRow({ item, collapsed }: { item: NavItem; collapsed: boolean }) {
  const Icon = item.icon;
  const [hover, setHover] = useState(false);
  return (
    <div className="relative" onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}>
      <NavLink
        to={item.to}
        end={item.end}
        className={({ isActive }) =>
          `group relative flex items-center gap-2.5 rounded-md px-2.5 py-[7px] text-[13px] font-medium ${
            collapsed ? 'justify-center' : ''
          } ${isActive ? 'text-white' : 'text-navy-200 hover:text-white'}`
        }
      >
        {({ isActive }) => (
          <>
            {isActive && (
              <motion.span
                layoutId="sidebar-active-pill"
                className="absolute inset-0 rounded-md bg-accent-600"
                transition={{ type: 'spring', stiffness: 500, damping: 40 }}
              />
            )}
            <Icon
              size={15}
              strokeWidth={2}
              className={`relative z-10 shrink-0 ${isActive ? 'text-white' : 'text-navy-400 group-hover:text-white'}`}
            />
            {!collapsed && (
              <span className="relative z-10 truncate">{item.label}</span>
            )}
          </>
        )}
      </NavLink>
      {collapsed && <RailTooltip show={hover}>{item.label}</RailTooltip>}
    </div>
  );
}

function SidebarContent({ collapsed, onNavigate }: { collapsed: boolean; onNavigate?: () => void }) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [profileHover, setProfileHover] = useState(false);
  const [logoutHover, setLogoutHover] = useState(false);
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
  const initials = (user?.name ?? user?.email ?? '?').trim().slice(0, 1).toUpperCase();

  return (
    <div className="flex h-full flex-col" onClick={onNavigate}>
      <nav className="flex-1 space-y-5 overflow-y-auto px-3 pb-4 pt-3">
        <div className="space-y-0.5">
          <NavRow item={OVERVIEW} collapsed={collapsed} />
        </div>
        {GROUPS.map((group) => (
          <div key={group.label}>
            {!collapsed ? (
              <p className="mb-1.5 px-2.5 text-[10.5px] font-semibold uppercase tracking-wider text-navy-400">{group.label}</p>
            ) : (
              <div className="mx-2.5 mb-1.5 border-t border-navy-800" />
            )}
            <div className="space-y-0.5">
              {group.items.map((item) => (
                <NavRow key={item.to} item={item} collapsed={collapsed} />
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className={`border-t border-navy-800 ${collapsed ? 'px-2' : 'px-4'} py-3.5`}>
        <div
          className={`mb-3 flex items-center gap-2 rounded-md ${collapsed ? 'relative justify-center px-0 py-1' : 'px-1 py-1'}`}
          onMouseEnter={() => setProfileHover(true)}
          onMouseLeave={() => setProfileHover(false)}
        >
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-navy-700 text-[11px] font-semibold text-white">
            {initials}
          </div>
          {!collapsed && (
            <div className="min-w-0 flex-1 leading-tight">
              <div className="flex items-center gap-1.5">
                <p className="truncate text-[12px] font-medium text-white">{user?.name}</p>
                <span className="shrink-0 rounded border border-accent-500/40 bg-accent-500/10 px-1 py-px text-[9px] font-semibold uppercase tracking-wide text-accent-300">
                  {user?.role}
                </span>
              </div>
              <p className="truncate text-[10.5px] text-navy-400">{user?.companies?.[0]?.name ?? user?.email}</p>
            </div>
          )}
          {collapsed && (
            <RailTooltip show={profileHover}>
              {user?.name} · {user?.role}
            </RailTooltip>
          )}
        </div>

        <div className="relative" onMouseEnter={() => setLogoutHover(true)} onMouseLeave={() => setLogoutHover(false)}>
          <button
            onClick={() => logout()}
            className={`flex w-full items-center gap-1.5 rounded-md border border-navy-700 px-3 py-[7px] text-[12px] font-medium text-navy-200 transition-colors hover:border-rose-400/40 hover:bg-rose-500/10 hover:text-rose-300 ${
              collapsed ? 'justify-center' : 'justify-center'
            }`}
          >
            <LogOut size={12} />
            {!collapsed && 'Log out'}
          </button>
          {collapsed && <RailTooltip show={logoutHover}>Log out</RailTooltip>}
        </div>

        {!collapsed && (
          <>
            <div className="mt-3 flex items-center gap-2 px-1 text-[11.5px] text-navy-300">
              <span className={`h-1.5 w-1.5 rounded-full ${engineReady ? 'bg-emerald-400' : 'bg-navy-600'}`} />
              {engineReady ? 'Allocation engine operational' : 'Awaiting first allocation run'}
            </div>

            <input ref={fileInputRef} type="file" accept="application/json,.json" className="hidden" onChange={handleFileChosen} />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={importMutation.isPending}
              className="mt-2.5 flex w-full items-center justify-center gap-1.5 rounded-md border border-navy-700 px-3 py-[7px] text-[12px] font-medium text-navy-200 transition-colors hover:border-accent-500/40 hover:bg-accent-500/10 hover:text-accent-300 disabled:opacity-60"
            >
              <Upload size={12} />
              {importMutation.isPending ? 'Importing…' : 'Import Data'}
            </button>

            <button
              onClick={() => setConfirmOpen(true)}
              className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-md border border-navy-700 px-3 py-[7px] text-[12px] font-medium text-navy-200 transition-colors hover:border-rose-400/40 hover:bg-rose-500/10 hover:text-rose-300"
            >
              <RefreshCcw size={12} />
              Reset Demo
            </button>
            <p className="mt-2.5 px-1 text-[10.5px] leading-relaxed text-navy-400">
              Decision-support only. FairFill proposes — a human always approves before funds move.
            </p>
          </>
        )}
      </div>

      {confirmOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-navy-950/60 backdrop-blur-[2px]" onClick={(e) => e.stopPropagation()}>
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
    </div>
  );
}

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem(COLLAPSE_KEY) === '1';
    } catch {
      return false;
    }
  });
  const [mobileOpen, setMobileOpen] = useState(false);
  const prefersReducedMotion = useReducedMotion();
  const location = useLocation();

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  function toggleCollapsed() {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(COLLAPSE_KEY, next ? '1' : '0');
      } catch {
        // best-effort persistence only
      }
      return next;
    });
  }

  const widthTransition = prefersReducedMotion ? { duration: 0 } : { type: 'spring' as const, stiffness: 320, damping: 32 };

  return (
    <>
      {/* Mobile top bar — the desktop rail is display:none below lg, so this is the only way to reach it there. */}
      <div className="fixed inset-x-0 top-0 z-40 flex items-center justify-between border-b border-navy-800 bg-navy-900 px-4 py-3 lg:hidden">
        <Logo size="sm" light />
        <button
          onClick={() => setMobileOpen(true)}
          aria-label="Open navigation"
          className="rounded-md p-1.5 text-navy-200 hover:bg-navy-800 hover:text-white"
        >
          <Menu size={20} />
        </button>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="fixed inset-0 z-50 bg-navy-950/60 lg:hidden"
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={prefersReducedMotion ? { duration: 0 } : { type: 'spring', stiffness: 360, damping: 36 }}
              className="fixed inset-y-0 left-0 z-50 flex w-[260px] flex-col bg-navy-900 lg:hidden"
            >
              <div className="flex items-center justify-between px-5 pb-4 pt-5">
                <Logo size="sm" light />
                <button
                  onClick={() => setMobileOpen(false)}
                  aria-label="Close navigation"
                  className="rounded-md p-1.5 text-navy-300 hover:bg-navy-800 hover:text-white"
                >
                  <X size={18} />
                </button>
              </div>
              <SidebarContent collapsed={false} onNavigate={() => setMobileOpen(false)} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Desktop rail */}
      <motion.aside
        animate={{ width: collapsed ? 76 : 232 }}
        transition={widthTransition}
        className="isolate hidden h-screen shrink-0 flex-col overflow-hidden bg-navy-900 lg:flex"
      >
        <div className={`flex items-center pb-5 pt-6 ${collapsed ? 'justify-center px-0' : 'justify-between px-5'}`}>
          {collapsed ? <LogoMark size="sm" /> : <Logo size="sm" light />}
          {!collapsed && (
            <button
              onClick={toggleCollapsed}
              aria-label="Collapse sidebar"
              className="rounded-md p-1 text-navy-400 hover:bg-navy-800 hover:text-white"
            >
              <ChevronLeft size={15} />
            </button>
          )}
        </div>
        {!collapsed && <p className="-mt-3 mb-1 pl-5 text-[10px] font-medium uppercase tracking-wider text-navy-500">CSR Intelligence</p>}

        <SidebarContent collapsed={collapsed} />

        {collapsed && (
          <button
            onClick={toggleCollapsed}
            aria-label="Expand sidebar"
            className="mx-auto mb-3 rounded-md p-1.5 text-navy-400 hover:bg-navy-800 hover:text-white"
          >
            <ChevronRight size={15} />
          </button>
        )}
      </motion.aside>
    </>
  );
}

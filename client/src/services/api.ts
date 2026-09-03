import type {
  Allocation,
  AuditEvent,
  ComparisonRow,
  DashboardData,
  Evidence,
  FairFillConfig,
  Milestone,
  Project,
  Reallocation,
  Region,
  RunFairFillResult,
} from '../types';

const BASE = '/api';

export class ApiRequestError extends Error {
  status: number;
  details?: unknown;
  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(options?.headers ?? {}) },
  });
  if (!res.ok) {
    let message = res.statusText;
    let details: unknown;
    try {
      const body = await res.json();
      message = body.error ?? message;
      details = body.details;
    } catch {
      // ignore parse failure
    }
    throw new ApiRequestError(res.status, message, details);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

const post = <T>(path: string, body?: unknown) =>
  request<T>(path, { method: 'POST', body: body !== undefined ? JSON.stringify(body) : undefined });

export const api = {
  getDashboard: () => request<DashboardData>('/dashboard'),
  getConfig: () => request<FairFillConfig>('/config'),

  listRegions: () => request<Region[]>('/regions'),
  getRegion: (id: string) => request<Region>(`/regions/${id}`),

  listProjects: () => request<Project[]>('/projects'),
  getProject: (id: string) => request<Project>(`/projects/${id}`),
  getProjectMilestones: (id: string) => request<Milestone[]>(`/projects/${id}/milestones`),

  runFairFill: () => post<RunFairFillResult>('/fairfill/run'),
  getComparison: () => request<ComparisonRow[]>('/fairfill/comparison'),

  listAllocations: () => request<Allocation[]>('/allocations'),
  approveAllocation: (id: string) => post<Allocation>(`/allocations/${id}/approve`),
  rejectAllocation: (id: string) => post<Allocation>(`/allocations/${id}/reject`),

  advanceSimulation: (projectId: string, months: number) => post<Project>(`/simulation/${projectId}/advance`, { months }),
  rewindSimulation: (projectId: string) => post<Project>(`/simulation/${projectId}/rewind`),
  jumpSimulation: (projectId: string) => post<Project>(`/simulation/${projectId}/jump`),
  failMilestone: (projectId: string, actualCompletion?: number) =>
    post<Project>(`/simulation/${projectId}/fail-milestone`, actualCompletion !== undefined ? { actualCompletion } : {}),

  completeMilestone: (milestoneId: string) => post<Project>(`/milestones/${milestoneId}/complete`),
  submitEvidence: (
    milestoneId: string,
    payload: { filename: string; description: string; simulatedLocation: string }
  ) => post<Evidence>(`/milestones/${milestoneId}/evidence`, payload),
  reviewEvidence: (evidenceId: string, status: 'REVIEWED' | 'FLAGGED') =>
    post<Evidence>(`/evidence/${evidenceId}/review`, { status }),

  listReallocations: () => request<Reallocation[]>('/reallocations'),
  approveReallocation: (id: string) => post<Reallocation>(`/reallocations/${id}/approve`),
  rejectReallocation: (id: string) => post<Reallocation>(`/reallocations/${id}/reject`),

  listAudit: () => request<AuditEvent[]>('/audit'),

  resetDemo: () => post<{ message: string }>('/demo/reset'),

  importData: (payload: unknown) =>
    post<{ message: string; regions: number; ngos: number; projects: number }>('/import', payload),
};

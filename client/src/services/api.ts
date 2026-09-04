import type {
  Allocation,
  AuditEvent,
  AuthUser,
  Company,
  ComparisonRow,
  DashboardData,
  Evidence,
  ExtractedProposalFields,
  FairFillConfig,
  InboxItem,
  Milestone,
  Project,
  Proposal,
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

// Set by AuthContext so any 401 from anywhere in the app — not just the
// request that happened to trigger it — clears the session and (if the
// user was actually logged in, not just failing a login attempt) surfaces
// an "expired" message on the next Login render.
let onUnauthorized: (() => void) | null = null;
export function setUnauthorizedHandler(handler: (() => void) | null) {
  onUnauthorized = handler;
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const isFormData = options?.body instanceof FormData;
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    credentials: 'include',
    headers: isFormData ? options?.headers : { 'Content-Type': 'application/json', ...(options?.headers ?? {}) },
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
    if (res.status === 401 && path !== '/auth/login') onUnauthorized?.();
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

  login: (email: string, password: string) => post<AuthUser>('/auth/login', { email, password }),
  logout: () => post<{ message: string }>('/auth/logout'),
  getMe: () => request<AuthUser>('/auth/me'),

  listCompanies: () => request<Company[]>('/companies'),

  previewProposal: (file: File) => {
    const form = new FormData();
    form.append('file', file);
    return request<{ filename: string; extracted: ExtractedProposalFields }>('/proposals/preview', { method: 'POST', body: form });
  },
  /**
   * Same endpoint as previewProposal, but via XMLHttpRequest so real
   * upload-progress events are available — fetch() has no cross-browser way
   * to report request-body progress, only response-download progress.
   */
  previewProposalWithProgress: (file: File, onProgress: (pct: number) => void) => {
    const form = new FormData();
    form.append('file', file);
    return new Promise<{ filename: string; extracted: ExtractedProposalFields }>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', `${BASE}/proposals/preview`);
      xhr.withCredentials = true;
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
      };
      xhr.onload = () => {
        let body: { error?: string; details?: unknown } & Partial<{ filename: string; extracted: ExtractedProposalFields }> = {};
        try {
          body = JSON.parse(xhr.responseText);
        } catch {
          // ignore parse failure — handled by the status check below
        }
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(body as { filename: string; extracted: ExtractedProposalFields });
        } else {
          reject(new ApiRequestError(xhr.status, body.error ?? xhr.statusText, body.details));
        }
      };
      xhr.onerror = () => reject(new ApiRequestError(0, 'Network error while uploading the file.'));
      xhr.send(form);
    });
  },
  submitProposal: (filename: string, extracted: ExtractedProposalFields, companyIds: string[]) =>
    post<Proposal>('/proposals', { filename, extracted, companyIds }),
  listSentProposals: () => request<Proposal[]>('/proposals/sent'),

  listInbox: () => request<InboxItem[]>('/proposals/inbox'),
  acceptProposal: (recipientId: string) => post<{ recipientId: string; project: Project }>(`/proposals/${recipientId}/accept`),
  rejectProposal: (recipientId: string) => post(`/proposals/${recipientId}/reject`),
};

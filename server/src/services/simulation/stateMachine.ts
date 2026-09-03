export const ProjectStates = {
  DRAFT: 'DRAFT',
  PROPOSED: 'PROPOSED',
  APPROVED: 'APPROVED',
  FUNDED: 'FUNDED',
  IN_PROGRESS: 'IN_PROGRESS',
  MILESTONE_COMPLETED: 'MILESTONE_COMPLETED',
  MILESTONE_MISSED: 'MILESTONE_MISSED',
  PAUSED: 'PAUSED',
  UNDER_REVIEW: 'UNDER_REVIEW',
  COMPLETED: 'COMPLETED',
  REALLOCATION_PROPOSED: 'REALLOCATION_PROPOSED',
  REALLOCATED: 'REALLOCATED',
} as const;

export type ProjectState = (typeof ProjectStates)[keyof typeof ProjectStates];

/**
 * The full valid-transition graph for a Project. Any transition not listed
 * here is rejected by assertTransition — this is the backend's single
 * authority on project lifecycle, never inferred implicitly by controllers.
 */
const TRANSITIONS: Record<ProjectState, ProjectState[]> = {
  DRAFT: ['PROPOSED'],
  PROPOSED: ['APPROVED', 'DRAFT'],
  APPROVED: ['FUNDED'],
  FUNDED: ['IN_PROGRESS'],
  IN_PROGRESS: ['MILESTONE_COMPLETED', 'MILESTONE_MISSED', 'PAUSED', 'COMPLETED'],
  MILESTONE_COMPLETED: ['IN_PROGRESS', 'COMPLETED'],
  MILESTONE_MISSED: ['PAUSED', 'UNDER_REVIEW', 'REALLOCATION_PROPOSED', 'IN_PROGRESS'],
  PAUSED: ['UNDER_REVIEW', 'IN_PROGRESS'],
  UNDER_REVIEW: ['IN_PROGRESS', 'REALLOCATION_PROPOSED', 'PAUSED'],
  REALLOCATION_PROPOSED: ['REALLOCATED', 'IN_PROGRESS', 'PAUSED'],
  REALLOCATED: ['IN_PROGRESS', 'COMPLETED'],
  COMPLETED: [],
};

export class InvalidTransitionError extends Error {
  constructor(from: string, to: string) {
    super(`Invalid project state transition: ${from} -> ${to}`);
    this.name = 'InvalidTransitionError';
  }
}

export function canTransition(from: ProjectState, to: ProjectState): boolean {
  return TRANSITIONS[from]?.includes(to) ?? false;
}

export function assertTransition(from: ProjectState, to: ProjectState): void {
  if (!canTransition(from, to)) {
    throw new InvalidTransitionError(from, to);
  }
}

export function allowedNextStates(from: ProjectState): ProjectState[] {
  return TRANSITIONS[from] ?? [];
}

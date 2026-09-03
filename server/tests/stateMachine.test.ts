import { describe, expect, it } from 'vitest';
import { allowedNextStates, assertTransition, canTransition, InvalidTransitionError } from '../src/services/simulation/stateMachine.js';

describe('project state machine', () => {
  it('allows the documented happy-path transitions', () => {
    expect(canTransition('PROPOSED', 'APPROVED')).toBe(true);
    expect(canTransition('APPROVED', 'FUNDED')).toBe(true);
    expect(canTransition('FUNDED', 'IN_PROGRESS')).toBe(true);
    expect(canTransition('IN_PROGRESS', 'MILESTONE_COMPLETED')).toBe(true);
    expect(canTransition('MILESTONE_MISSED', 'REALLOCATION_PROPOSED')).toBe(true);
    expect(canTransition('REALLOCATION_PROPOSED', 'REALLOCATED')).toBe(true);
  });

  it('rejects skipping the funding pipeline', () => {
    expect(canTransition('FUNDED', 'COMPLETED')).toBe(false);
    expect(canTransition('PROPOSED', 'FUNDED')).toBe(false);
    expect(canTransition('DRAFT', 'APPROVED')).toBe(false);
  });

  it('has no outgoing transitions from a terminal COMPLETED state', () => {
    expect(allowedNextStates('COMPLETED')).toHaveLength(0);
  });

  it('does not allow an external-dependency miss to jump straight to REALLOCATED', () => {
    // External dependency failures must go through PAUSED/UNDER_REVIEW and a human
    // decision — never straight to an automatic reallocation.
    expect(canTransition('IN_PROGRESS', 'REALLOCATED')).toBe(false);
  });

  it('throws a descriptive InvalidTransitionError for an illegal transition', () => {
    expect(() => assertTransition('DRAFT', 'COMPLETED')).toThrow(InvalidTransitionError);
    expect(() => assertTransition('DRAFT', 'COMPLETED')).toThrow('DRAFT -> COMPLETED');
  });

  it('allows a rejected reallocation to fall back to PAUSED for manual handling', () => {
    expect(canTransition('REALLOCATION_PROPOSED', 'PAUSED')).toBe(true);
  });
});

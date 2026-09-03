/**
 * Single source of truth for every tunable constant in the FairFill engine.
 * Nothing in the scoring/allocation services should hard-code a weight —
 * everything reads from here so the whole system stays auditable and
 * explainable (same inputs -> same outputs, and the "why" is inspectable).
 */

export const TOTAL_CSR_POOL = 10_000_000; // ₹1 Crore

// Layer 2 scoring weights: adjustedScore = impactEfficiency * trust * (1 + ALPHA*underservice + BETA*equity)
export const ALPHA_UNDERSERVICE_WEIGHT = 0.3;
export const BETA_EQUITY_WEIGHT = 0.2;

// impactEfficiency is expressed as "impact units per ₹1,00,000 (1 lakh)" for readable numbers.
export const IMPACT_EFFICIENCY_SCALE = 100_000;

// Underservice indicator weights (must sum to 1). Configurable per domain in the future;
// the prototype uses one shared weighting across domains for simplicity.
export const UNDERSERVICE_INDICATOR_WEIGHTS: Record<string, number> = {
  doctorAvailability: 0.3,
  hospitalBeds: 0.25,
  healthcareAccess: 0.25,
  csrFundingGap: 0.2,
  // Non-healthcare domains reuse the same four "slots" conceptually
  // (primary access, secondary access, coverage, funding gap).
  waterAccess: 0.3,
  sanitationCoverage: 0.25,
  groundwaterQuality: 0.25,
  teacherAvailability: 0.3,
  schoolInfrastructure: 0.25,
  enrollmentRate: 0.25,
};

// Salvage logic
export const SALVAGE_THRESHOLD = 0.6; // 60%

// Trust multiplier bounds
export const TRUST_MULTIPLIER_MIN = 0.5;
export const TRUST_MULTIPLIER_MAX = 1.2;

// Domains supported by the demo dataset (architecture allows more Schedule VII domains later)
export const SUPPORTED_DOMAINS = ['HEALTHCARE', 'WATER_SANITATION', 'EDUCATION'] as const;
export type Domain = (typeof SUPPORTED_DOMAINS)[number];

// Numerical tolerance used throughout the water-filling / marginal-fill algorithms
export const EPSILON = 1e-6;

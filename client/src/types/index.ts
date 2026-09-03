export interface RegionIndicator {
  id: string;
  key: string;
  label: string;
  regionalValue: number;
  benchmarkValue: number;
  weight: number;
  lowerIsWorse: boolean;
  gap: number;
}

export interface Region {
  id: string;
  name: string;
  state: string;
  population: number;
  peerGroup: string;
  domain: string;
  needIndex: number;
  underserviceScore: number;
  geographicalEquityScore: number;
  historicalCSR: number;
  serviceLevel: number;
  benchmarkServiceLevel: number;
  budgetDemand: number;
  budgetCap: number | null;
  allocatedAmount: number;
  indicators?: RegionIndicator[];
  projects?: Project[];
  ngos?: Ngo[];
  underserviceExplanation?: {
    score: number;
    serviceLevel: number;
    contributors: { key: string; regionalValue: number; benchmarkValue: number; gap: number; weight: number; contribution: number }[];
  };
  equityExplanation?: {
    fundingPerNeed: number;
    peerAverageFundingPerNeed: number;
    relativeFundingGapPct: number;
    score: number;
  };
}

export interface Ngo {
  id: string;
  name: string;
  regionId: string;
  trustMultiplier: number;
  projectsCompleted: number;
  projectsDelayed: number;
  projectsFailed: number;
}

export interface ProjectTier {
  id: string;
  order: number;
  amount: number;
  impact: number;
  fundedAmount: number;
}

export interface Milestone {
  id: string;
  projectId: string;
  name: string;
  dueMonth: number;
  order: number;
  type: 'SELF_CONTROLLED' | 'EXTERNAL_DEPENDENCY';
  expectedCompletion: number;
  actualCompletion: number | null;
  status: 'UPCOMING' | 'IN_PROGRESS' | 'COMPLETED' | 'MISSED' | 'PAUSED' | 'UNDER_REVIEW';
  evidence?: Evidence | null;
}

export interface Evidence {
  id: string;
  milestoneId: string;
  filename: string;
  description: string;
  simulatedLocation: string;
  timestamp: string;
}

export interface Project {
  id: string;
  name: string;
  ngoId: string;
  ngo?: Ngo;
  regionId: string;
  region?: Region;
  domain: string;
  description: string;
  requestedBudget: number;
  impactUnits: number;
  impactPerRupee: number;
  underserviceScore: number;
  equityScore: number;
  trustMultiplier: number;
  finalScore: number;
  status: string;
  completionPercentage: number;
  currentSimulatedMonth: number;
  salvageThreshold: number;
  fundedAmount: number;
  isConcave: boolean;
  isComparisonHighlight: string | null;
  isDemoFeature: string | null;
  lastSalvageDecision: string | null;
  lastSalvageReason: string | null;
  tiers?: ProjectTier[];
  milestones?: Milestone[];
  allocations?: Allocation[];
  allowedNextStates?: string[];
  scoreBreakdown?: ScoreBreakdown;
}

export interface ScoreBreakdown {
  impactUnits: number;
  amount: number;
  impactEfficiency: number;
  trustMultiplier: number;
  underserviceScore: number;
  equityScore: number;
  underserviceBonusPct: number;
  equityBonusPct: number;
  totalMultiplier: number;
  baseScore: number;
  finalScore: number;
}

export interface Allocation {
  id: string;
  projectId: string;
  project?: Project;
  regionId: string;
  region?: Region;
  amount: number;
  reason: string;
  score: number;
  status: 'PROPOSED' | 'APPROVED' | 'REJECTED' | 'RELEASED' | 'REALLOCATED';
  createdAt: string;
}

export interface Reallocation {
  id: string;
  sourceProjectId: string;
  sourceProject?: Project;
  destinationProjectId: string;
  destinationProject?: Project;
  amount: number;
  reason: string;
  destinationScore: number;
  explanation: string;
  status: 'PROPOSED' | 'APPROVED' | 'REJECTED';
  createdAt: string;
}

export interface AuditEvent {
  id: string;
  event: string;
  actor: string;
  details: string;
  timestamp: string;
}

export interface DashboardData {
  totalPool: number;
  allocated: number;
  remaining: number;
  regionsServed: number;
  totalRegions: number;
  projectsFunded: number;
  totalProjects: number;
  avgImpactPerRupee: number;
  equityImprovementPct: number;
  activeProjects: number;
  pendingApprovals: number;
  fairFillHasRun: boolean;
}

export interface WaterFillRound {
  round: number;
  activeRegionIds: string[];
  equalShare: number;
  satisfiedThisRound: string[];
  remainingPoolBefore: number;
  remainingPoolAfter: number;
}

export interface RegionCapResult {
  regionId: string;
  name: string;
  demand: number;
  cap: number;
  satisfiedFully: boolean;
}

export interface RunFairFillResult {
  totalPool: number;
  waterFill: {
    totalPool: number;
    totalDemand: number;
    unallocatedResidual: number;
    caps: RegionCapResult[];
    rounds: WaterFillRound[];
  };
  regionResults: {
    regionId: string;
    cap: number;
    spent: number;
    residual: number;
    outcomes: { projectId: string; name: string; isConcave: boolean; fundedAmount: number; fundedImpact: number; tiersFunded: number; totalTiers: number; finalScore: number }[];
    steps: { projectId: string; projectName: string; tierOrder: number; marginalAmount: number; marginalImpact: number; marginalEfficiency: number; adjustedScore: number; cumulativeSpentInRegion: number; mode: string }[];
  }[];
  regionScores: { regionId: string; name: string; underserviceScore: number; geographicalEquityScore: number; serviceLevel: number }[];
}

export interface ComparisonRow {
  regionId: string;
  name: string;
  traditionalAmount: number;
  fairfillAmount: number;
}

export interface FairFillConfig {
  totalCsrPool: number;
  alphaUnderserviceWeight: number;
  betaEquityWeight: number;
  impactEfficiencyScale: number;
  salvageThreshold: number;
  trustMultiplierRange: [number, number];
  underserviceIndicatorWeights: Record<string, number>;
}

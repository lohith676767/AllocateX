import { prisma } from '../db/client.js';

interface TierSpec {
  order: number;
  amount: number;
  impact: number;
}

/** Generates a standard 3-band concave tier curve: 40% budget -> 55% impact, 75% -> 85%, 100% -> 100%. */
function standardTiers(totalAmount: number, totalImpact: number): TierSpec[] {
  return [
    { order: 1, amount: Math.round(totalAmount * 0.4), impact: Math.round(totalImpact * 0.55) },
    { order: 2, amount: Math.round(totalAmount * 0.75), impact: Math.round(totalImpact * 0.85) },
    { order: 3, amount: totalAmount, impact: totalImpact },
  ];
}

const NATIONAL_PEER_COHORT = 'National CSR Peer Cohort';

async function wipeDatabase() {
  await prisma.evidence.deleteMany();
  await prisma.milestone.deleteMany();
  await prisma.allocation.deleteMany();
  await prisma.reallocation.deleteMany();
  await prisma.auditEvent.deleteMany();
  await prisma.projectTier.deleteMany();
  await prisma.project.deleteMany();
  await prisma.nGO.deleteMany();
  await prisma.regionIndicator.deleteMany();
  await prisma.region.deleteMany();
}

export async function seedDatabase() {
  await wipeDatabase();

  // ── Regions ──────────────────────────────────────────────────────────
  const bundelkhand = await prisma.region.create({
    data: {
      name: 'Bundelkhand',
      state: 'Uttar Pradesh',
      population: 850_000,
      peerGroup: NATIONAL_PEER_COHORT,
      domain: 'HEALTHCARE',
      needIndex: 85,
      historicalCSR: 5_800_000,
      indicators: {
        create: [
          { key: 'doctorAvailability', label: 'Doctors per 10,000 population', regionalValue: 1.8, benchmarkValue: 6.5, lowerIsWorse: true },
          { key: 'hospitalBeds', label: 'Hospital beds per 10,000 population', regionalValue: 2.5, benchmarkValue: 9.0, lowerIsWorse: true },
          { key: 'healthcareAccess', label: 'Population within 5km of a facility', regionalValue: 0.28, benchmarkValue: 0.80, lowerIsWorse: true },
          { key: 'csrFundingGap', label: 'CSR funding per beneficiary (₹)', regionalValue: 9, benchmarkValue: 65, lowerIsWorse: true },
        ],
      },
    },
  });

  const vidarbha = await prisma.region.create({
    data: {
      name: 'Vidarbha',
      state: 'Maharashtra',
      population: 1_100_000,
      peerGroup: NATIONAL_PEER_COHORT,
      domain: 'WATER_SANITATION',
      needIndex: 110,
      historicalCSR: 7_150_000,
      indicators: {
        create: [
          { key: 'waterAccess', label: 'Households with piped water', regionalValue: 0.32, benchmarkValue: 0.85, lowerIsWorse: true },
          { key: 'sanitationCoverage', label: 'Households with functional toilets', regionalValue: 0.41, benchmarkValue: 0.90, lowerIsWorse: true },
          { key: 'groundwaterQuality', label: 'Sources testing safe for drinking', regionalValue: 0.35, benchmarkValue: 0.85, lowerIsWorse: true },
          { key: 'csrFundingGap', label: 'CSR funding per beneficiary (₹)', regionalValue: 7, benchmarkValue: 55, lowerIsWorse: true },
        ],
      },
    },
  });

  const coastalOdisha = await prisma.region.create({
    data: {
      name: 'Coastal Odisha',
      state: 'Odisha',
      population: 620_000,
      peerGroup: NATIONAL_PEER_COHORT,
      domain: 'EDUCATION',
      needIndex: 62,
      historicalCSR: 5_580_000,
      indicators: {
        create: [
          { key: 'teacherAvailability', label: 'Teachers per 1,000 students', regionalValue: 18, benchmarkValue: 30, lowerIsWorse: true },
          { key: 'schoolInfrastructure', label: 'Schools with functional infrastructure', regionalValue: 0.55, benchmarkValue: 0.85, lowerIsWorse: true },
          { key: 'enrollmentRate', label: 'Net enrollment rate', regionalValue: 0.68, benchmarkValue: 0.92, lowerIsWorse: true },
          { key: 'csrFundingGap', label: 'CSR funding per beneficiary (₹)', regionalValue: 25, benchmarkValue: 55, lowerIsWorse: true },
        ],
      },
    },
  });

  const bengaluru = await prisma.region.create({
    data: {
      name: 'North Bengaluru Urban',
      state: 'Karnataka',
      population: 480_000,
      peerGroup: NATIONAL_PEER_COHORT,
      domain: 'HEALTHCARE',
      needIndex: 48,
      historicalCSR: 8_400_000,
      indicators: {
        create: [
          { key: 'doctorAvailability', label: 'Doctors per 10,000 population', regionalValue: 6.8, benchmarkValue: 6.5, lowerIsWorse: true },
          { key: 'hospitalBeds', label: 'Hospital beds per 10,000 population', regionalValue: 9.5, benchmarkValue: 9.0, lowerIsWorse: true },
          { key: 'healthcareAccess', label: 'Population within 5km of a facility', regionalValue: 0.83, benchmarkValue: 0.80, lowerIsWorse: true },
          { key: 'csrFundingGap', label: 'CSR funding per beneficiary (₹)', regionalValue: 72, benchmarkValue: 65, lowerIsWorse: true },
        ],
      },
    },
  });

  // ── NGOs ─────────────────────────────────────────────────────────────
  const grameenSwasthya = await prisma.nGO.create({
    data: { name: 'Grameen Swasthya Trust', regionId: bundelkhand.id, trustMultiplier: 1.1, projectsCompleted: 14, projectsDelayed: 2, projectsFailed: 0 },
  });
  const sahyog = await prisma.nGO.create({
    data: { name: 'Sahyog Rural Development', regionId: bundelkhand.id, trustMultiplier: 0.75, projectsCompleted: 5, projectsDelayed: 4, projectsFailed: 2 },
  });
  const jalDhara = await prisma.nGO.create({
    data: { name: 'JalDhara Foundation', regionId: vidarbha.id, trustMultiplier: 0.95, projectsCompleted: 9, projectsDelayed: 3, projectsFailed: 1 },
  });
  const vidyaSetu = await prisma.nGO.create({
    data: { name: 'Vidya Setu', regionId: coastalOdisha.id, trustMultiplier: 1.05, projectsCompleted: 11, projectsDelayed: 1, projectsFailed: 0 },
  });
  const urbanCare = await prisma.nGO.create({
    data: { name: 'UrbanCare Health Alliance', regionId: bengaluru.id, trustMultiplier: 1.15, projectsCompleted: 20, projectsDelayed: 1, projectsFailed: 0 },
  });

  // ── Projects ─────────────────────────────────────────────────────────

  await createProject({
    name: 'Rural Primary Healthcare Centre',
    ngoId: grameenSwasthya.id,
    regionId: bundelkhand.id,
    domain: 'HEALTHCARE',
    description: 'Establishes a primary healthcare centre serving 12 villages with no existing facility within 5km.',
    requestedBudget: 1_800_000,
    impactUnits: 3200,
    isDemoFeature: 'SUCCESS',
    milestones: [
      { name: 'Equipment purchased', dueMonth: 1, type: 'SELF_CONTROLLED', expectedCompletion: 0.35, order: 1 },
      { name: 'Staff deployed', dueMonth: 3, type: 'SELF_CONTROLLED', expectedCompletion: 0.70, order: 2 },
      { name: 'Centre operational', dueMonth: 6, type: 'SELF_CONTROLLED', expectedCompletion: 1.0, order: 3 },
    ],
  });

  await createProject({
    name: 'Community Health Facility',
    ngoId: sahyog.id,
    regionId: bundelkhand.id,
    domain: 'HEALTHCARE',
    description: 'A new community health facility pending government land approval before construction can begin.',
    requestedBudget: 1_500_000,
    impactUnits: 2600,
    isDemoFeature: 'EXTERNAL_DEPENDENCY',
    milestones: [
      { name: 'Government land approval', dueMonth: 2, type: 'EXTERNAL_DEPENDENCY', expectedCompletion: 0.2, order: 1 },
      { name: 'Construction start', dueMonth: 4, type: 'SELF_CONTROLLED', expectedCompletion: 0.6, order: 2 },
      { name: 'Facility operational', dueMonth: 6, type: 'SELF_CONTROLLED', expectedCompletion: 1.0, order: 3 },
    ],
  });

  await createProject({
    name: 'Rural Water Access Project',
    ngoId: jalDhara.id,
    regionId: vidarbha.id,
    domain: 'WATER_SANITATION',
    description: 'Piped water access for 6 villages via new pipeline infrastructure and household connections.',
    requestedBudget: 2_000_000,
    impactUnits: 1600,
    isDemoFeature: 'SELF_FAILURE',
    tiers: [
      { order: 1, amount: 800_000, impact: 900 },
      { order: 2, amount: 1_200_000, impact: 1200 },
      { order: 3, amount: 2_000_000, impact: 1600 },
    ],
    milestones: [
      { name: 'Pipeline survey completed', dueMonth: 1, type: 'SELF_CONTROLLED', expectedCompletion: 0.25, order: 1 },
      { name: 'Pipeline deployment', dueMonth: 3, type: 'SELF_CONTROLLED', expectedCompletion: 0.70, order: 2 },
    ],
  });

  await createProject({
    name: 'Bundelkhand Mobile Health Units',
    ngoId: grameenSwasthya.id,
    regionId: bundelkhand.id,
    domain: 'HEALTHCARE',
    description: 'Mobile health units bringing diagnostics and basic treatment to remote, chronically underserved villages.',
    requestedBudget: 1_000_000,
    impactUnits: 1700,
    isComparisonHighlight: 'FAIRFILL_WINNER',
    milestones: [{ name: 'Mobile unit deployment', dueMonth: 3, type: 'SELF_CONTROLLED', expectedCompletion: 1.0, order: 1 }],
  });

  await createProject({
    name: 'Urban Diagnostic Imaging Center',
    ngoId: urbanCare.id,
    regionId: bengaluru.id,
    domain: 'HEALTHCARE',
    description: 'A high-throughput diagnostic imaging center expanding capacity in an already well-served urban ward.',
    requestedBudget: 1_000_000,
    impactUnits: 2000,
    isComparisonHighlight: 'IMPACT_ONLY',
    milestones: [{ name: 'Equipment installation', dueMonth: 2, type: 'SELF_CONTROLLED', expectedCompletion: 1.0, order: 1 }],
  });

  await createProject({
    name: 'Vidarbha Groundwater Recharge Programme',
    ngoId: jalDhara.id,
    regionId: vidarbha.id,
    domain: 'WATER_SANITATION',
    description: 'Check-dams and recharge structures to restore groundwater tables across drought-prone talukas.',
    requestedBudget: 1_400_000,
    impactUnits: 900,
    tiers: [
      { order: 1, amount: 600_000, impact: 500 },
      { order: 2, amount: 1_000_000, impact: 750 },
      { order: 3, amount: 1_400_000, impact: 900 },
    ],
    milestones: [
      { name: 'Site survey', dueMonth: 1, type: 'SELF_CONTROLLED', expectedCompletion: 0.3, order: 1 },
      { name: 'Recharge structures built', dueMonth: 4, type: 'SELF_CONTROLLED', expectedCompletion: 1.0, order: 2 },
    ],
  });

  await createProject({
    name: 'Community Handpump Repair Initiative',
    ngoId: jalDhara.id,
    regionId: vidarbha.id,
    domain: 'WATER_SANITATION',
    description: 'Rapid repair of non-functional community handpumps identified in a district-wide survey.',
    requestedBudget: 600_000,
    impactUnits: 600,
    tiers: [
      { order: 1, amount: 300_000, impact: 350 },
      { order: 2, amount: 600_000, impact: 600 },
    ],
    milestones: [
      { name: 'Parts procurement', dueMonth: 1, type: 'SELF_CONTROLLED', expectedCompletion: 0.4, order: 1 },
      { name: 'Repairs completed', dueMonth: 3, type: 'SELF_CONTROLLED', expectedCompletion: 1.0, order: 2 },
    ],
  });

  await createProject({
    name: 'Coastal Odisha School Renovation',
    ngoId: vidyaSetu.id,
    regionId: coastalOdisha.id,
    domain: 'EDUCATION',
    description: 'Structural renovation of 4 government schools with failing infrastructure post cyclone damage.',
    requestedBudget: 800_000,
    impactUnits: 1400,
    milestones: [
      { name: 'Structural repairs', dueMonth: 2, type: 'SELF_CONTROLLED', expectedCompletion: 0.5, order: 1 },
      { name: 'Renovation complete', dueMonth: 5, type: 'SELF_CONTROLLED', expectedCompletion: 1.0, order: 2 },
    ],
  });

  await createProject({
    name: 'Digital Learning Labs',
    ngoId: vidyaSetu.id,
    regionId: coastalOdisha.id,
    domain: 'EDUCATION',
    description: 'Computer labs and digital learning content for secondary schools lacking any digital infrastructure.',
    requestedBudget: 600_000,
    impactUnits: 1100,
    milestones: [
      { name: 'Hardware procured', dueMonth: 2, type: 'SELF_CONTROLLED', expectedCompletion: 0.45, order: 1 },
      { name: 'Labs operational', dueMonth: 4, type: 'SELF_CONTROLLED', expectedCompletion: 1.0, order: 2 },
    ],
  });

  await createProject({
    name: "Girls' Hostel Construction",
    ngoId: vidyaSetu.id,
    regionId: coastalOdisha.id,
    domain: 'EDUCATION',
    description: 'Residential hostel to reduce dropout among girls travelling long distances to secondary school.',
    requestedBudget: 900_000,
    impactUnits: 500,
    milestones: [
      { name: 'Land allotment by Panchayat', dueMonth: 2, type: 'EXTERNAL_DEPENDENCY', expectedCompletion: 0.2, order: 1 },
      { name: 'Construction complete', dueMonth: 6, type: 'SELF_CONTROLLED', expectedCompletion: 1.0, order: 2 },
    ],
  });

  await createProject({
    name: 'Corporate Hospital CSR Wing Expansion',
    ngoId: urbanCare.id,
    regionId: bengaluru.id,
    domain: 'HEALTHCARE',
    description: 'Adds a subsidized-care wing to an existing well-resourced urban hospital.',
    requestedBudget: 1_200_000,
    impactUnits: 2600,
    milestones: [
      { name: 'Wing foundation laid', dueMonth: 2, type: 'SELF_CONTROLLED', expectedCompletion: 0.4, order: 1 },
      { name: 'Wing operational', dueMonth: 5, type: 'SELF_CONTROLLED', expectedCompletion: 1.0, order: 2 },
    ],
  });

  await prisma.auditEvent.create({
    data: {
      event: 'DEMO_RESET',
      actor: 'System',
      details: `Demo scenario seeded: 4 regions, 5 NGOs, 11 projects, ${await prisma.milestone.count()} milestones.`,
    },
  });

  const counts = {
    regions: await prisma.region.count(),
    ngos: await prisma.nGO.count(),
    projects: await prisma.project.count(),
    milestones: await prisma.milestone.count(),
  };
  return counts;
}

interface MilestoneSpec {
  name: string;
  dueMonth: number;
  type: 'SELF_CONTROLLED' | 'EXTERNAL_DEPENDENCY';
  expectedCompletion: number;
  order: number;
}

async function createProject(input: {
  name: string;
  ngoId: string;
  regionId: string;
  domain: string;
  description: string;
  requestedBudget: number;
  impactUnits: number;
  tiers?: TierSpec[];
  milestones: MilestoneSpec[];
  isDemoFeature?: string;
  isComparisonHighlight?: string;
}) {
  const tiers = input.tiers ?? standardTiers(input.requestedBudget, input.impactUnits);

  return prisma.project.create({
    data: {
      name: input.name,
      ngoId: input.ngoId,
      regionId: input.regionId,
      domain: input.domain,
      description: input.description,
      requestedBudget: input.requestedBudget,
      impactUnits: input.impactUnits,
      status: 'PROPOSED',
      isDemoFeature: input.isDemoFeature,
      isComparisonHighlight: input.isComparisonHighlight,
      tiers: { create: tiers },
      milestones: { create: input.milestones },
    },
  });
}

const isMainModule = process.argv[1] && import.meta.url === `file://${process.argv[1]}`;

if (isMainModule) {
  seedDatabase()
    .then((counts) => {
      console.log('Seed complete:', counts);
      return prisma.$disconnect();
    })
    .catch(async (err) => {
      console.error(err);
      await prisma.$disconnect();
      process.exit(1);
    });
}

import { prisma } from '../db/client.js';
import { standardTiers, type TierSpec } from '../seed/seed.js';
import { ApiError } from '../utils/errors.js';
import { AuditEvents, logAudit } from './audit.js';

interface IndicatorInput {
  key: string;
  label: string;
  regionalValue: number;
  benchmarkValue: number;
  lowerIsWorse?: boolean;
}

interface RegionInput {
  name: string;
  state: string;
  population: number;
  peerGroup: string;
  domain: string;
  needIndex: number;
  historicalCSR: number;
  indicators?: IndicatorInput[];
}

interface NgoInput {
  name: string;
  regionName: string;
  trustMultiplier: number;
  projectsCompleted?: number;
  projectsDelayed?: number;
  projectsFailed?: number;
}

interface MilestoneInput {
  name: string;
  dueMonth: number;
  type: 'SELF_CONTROLLED' | 'EXTERNAL_DEPENDENCY';
  expectedCompletion: number;
  order: number;
}

interface ProjectInput {
  name: string;
  ngoName: string;
  regionName: string;
  domain: string;
  description: string;
  requestedBudget: number;
  impactUnits: number;
  tiers?: TierSpec[];
  milestones?: MilestoneInput[];
}

export interface ImportPayload {
  regions?: RegionInput[];
  ngos?: NgoInput[];
  projects?: ProjectInput[];
}

function requireFields(obj: object, fields: string[], label: string) {
  const rec = obj as Record<string, unknown>;
  const missing = fields.filter((f) => rec[f] === undefined || rec[f] === null || rec[f] === '');
  if (missing.length > 0) {
    throw ApiError.badRequest(`${label} is missing required field(s): ${missing.join(', ')}`, obj);
  }
}

/**
 * Additive import: creates new regions/NGOs/projects from a judge-supplied
 * JSON file without touching anything already in the database. Name-based
 * references (regionName/ngoName) resolve against both records already in
 * the DB and records created earlier in the same import, so a file can add
 * a project to an existing seeded region without re-describing it.
 */
export async function importScenario(payload: ImportPayload) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    throw ApiError.badRequest('Import file must be a JSON object with regions/ngos/projects arrays.');
  }

  const regionIdByName = new Map<string, string>();
  const ngoIdByName = new Map<string, string>();

  let regionsCreated = 0;
  let ngosCreated = 0;
  let projectsCreated = 0;

  for (const r of payload.regions ?? []) {
    requireFields(r, ['name', 'state', 'population', 'peerGroup', 'domain', 'needIndex', 'historicalCSR'], 'Region');
    const region = await prisma.region.create({
      data: {
        name: r.name,
        state: r.state,
        population: r.population,
        peerGroup: r.peerGroup,
        domain: r.domain,
        needIndex: r.needIndex,
        historicalCSR: r.historicalCSR,
        indicators: {
          create: (r.indicators ?? []).map((i) => {
            requireFields(i, ['key', 'label', 'regionalValue', 'benchmarkValue'], `Indicator on region "${r.name}"`);
            return {
              key: i.key,
              label: i.label,
              regionalValue: i.regionalValue,
              benchmarkValue: i.benchmarkValue,
              lowerIsWorse: i.lowerIsWorse ?? true,
            };
          }),
        },
      },
    });
    regionIdByName.set(region.name, region.id);
    regionsCreated++;
  }

  async function resolveRegionId(name: string): Promise<string> {
    const cached = regionIdByName.get(name);
    if (cached) return cached;
    const existing = await prisma.region.findFirst({ where: { name } });
    if (!existing) throw ApiError.badRequest(`No region named "${name}" found (not in this file or the existing database).`);
    regionIdByName.set(name, existing.id);
    return existing.id;
  }

  async function resolveNgoId(name: string): Promise<string> {
    const cached = ngoIdByName.get(name);
    if (cached) return cached;
    const existing = await prisma.nGO.findFirst({ where: { name } });
    if (!existing) throw ApiError.badRequest(`No NGO named "${name}" found (not in this file or the existing database).`);
    ngoIdByName.set(name, existing.id);
    return existing.id;
  }

  for (const n of payload.ngos ?? []) {
    requireFields(n, ['name', 'regionName', 'trustMultiplier'], 'NGO');
    const regionId = await resolveRegionId(n.regionName);
    const ngo = await prisma.nGO.create({
      data: {
        name: n.name,
        regionId,
        trustMultiplier: n.trustMultiplier,
        projectsCompleted: n.projectsCompleted ?? 0,
        projectsDelayed: n.projectsDelayed ?? 0,
        projectsFailed: n.projectsFailed ?? 0,
      },
    });
    ngoIdByName.set(ngo.name, ngo.id);
    ngosCreated++;
  }

  for (const p of payload.projects ?? []) {
    requireFields(
      p,
      ['name', 'ngoName', 'regionName', 'domain', 'description', 'requestedBudget', 'impactUnits'],
      'Project'
    );
    const [regionId, ngoId] = await Promise.all([resolveRegionId(p.regionName), resolveNgoId(p.ngoName)]);
    const tiers = p.tiers && p.tiers.length > 0 ? p.tiers : standardTiers(p.requestedBudget, p.impactUnits);
    await prisma.project.create({
      data: {
        name: p.name,
        ngoId,
        regionId,
        domain: p.domain,
        description: p.description,
        requestedBudget: p.requestedBudget,
        impactUnits: p.impactUnits,
        status: 'PROPOSED',
        tiers: { create: tiers },
        milestones: { create: p.milestones ?? [] },
      },
    });
    projectsCreated++;
  }

  const counts = { regions: regionsCreated, ngos: ngosCreated, projects: projectsCreated };
  await logAudit(
    AuditEvents.DATA_IMPORTED,
    `Imported ${counts.regions} region(s), ${counts.ngos} NGO(s) and ${counts.projects} project(s) from an uploaded file.`
  );
  return counts;
}

// Import the inner module directly, not the package's top-level index.js —
// that file has a `!module.parent` self-test guard which some ESM loaders
// (including tsx) trip, making it try to read a fixture file that doesn't
// exist in the installed package and crash on the very first import.
// eslint-disable-next-line @typescript-eslint/no-var-requires
import pdfParse from 'pdf-parse/lib/pdf-parse.js';
import { ApiError } from '../utils/errors.js';
import { SUPPORTED_DOMAINS } from '../config/fairfillConfig.js';

export interface ExtractedProposal {
  name: string;
  description: string;
  domain: string;
  requestedBudget: number;
  impactUnits: number;
  regionNameGuess: string | null;
  note: string;
}

const DOMAIN_KEYWORDS: Record<string, string> = {
  water: 'WATER_SANITATION',
  sanitation: 'WATER_SANITATION',
  toilet: 'WATER_SANITATION',
  health: 'HEALTHCARE',
  medical: 'HEALTHCARE',
  hospital: 'HEALTHCARE',
  clinic: 'HEALTHCARE',
  school: 'EDUCATION',
  education: 'EDUCATION',
  learning: 'EDUCATION',
  literacy: 'EDUCATION',
};

/**
 * Extracts raw text from an uploaded proposal file. PDF and DOCX go through
 * their respective parsers; anything else (plain text/markdown) is read
 * directly. This is the only format-specific part of the pipeline — the
 * field extraction below works on plain text regardless of source.
 */
export async function extractTextFromFile(buffer: Buffer, filename: string, mimetype: string): Promise<string> {
  const lower = filename.toLowerCase();
  if (lower.endsWith('.pdf') || mimetype === 'application/pdf') {
    try {
      const result = await pdfParse(buffer);
      return result.text;
    } catch {
      // pdf-parse bundles an old pdf.js build that can choke on certain
      // real-world PDF producers (internal errors like "bad XRef entry" or
      // "Illegal character") — surface a clear, actionable message instead
      // of that raw parser stack trace.
      throw ApiError.badRequest(
        'Could not read this PDF — it may be corrupted, scanned/image-only, or use formatting this reader doesn\'t support. Try re-saving it, or upload it as a DOCX or plain text file instead.'
      );
    }
  }
  if (lower.endsWith('.docx') || mimetype.includes('officedocument.wordprocessingml')) {
    try {
      const mammoth = await import('mammoth');
      const result = await mammoth.extractRawText({ buffer });
      return result.value;
    } catch {
      throw ApiError.badRequest('Could not read this DOCX file — it may be corrupted. Try re-saving it, or upload it as plain text instead.');
    }
  }
  return buffer.toString('utf-8');
}

function findField(text: string, labels: string[]): string | null {
  for (const label of labels) {
    const re = new RegExp(`${label}\\s*[:\\-]\\s*(.+)`, 'i');
    const match = text.match(re);
    if (match?.[1]) return match[1].trim().split('\n')[0].trim();
  }
  return null;
}

// Every label recognized anywhere in the document — used to know where a
// multi-line field (like description) should stop, so it doesn't swallow
// the next field's heading.
const ALL_LABELS = [
  'project name',
  'project title',
  'project',
  'title',
  'description',
  'summary',
  'overview',
  'requested budget',
  'budget requested',
  'amount requested',
  'budget',
  'total cost',
  'funding requested',
  'impact units',
  'expected beneficiaries',
  'beneficiaries',
  'people impacted',
  'households',
  'region',
  'location',
  'district',
  'area',
  'domain',
  'sector',
  'submitted by',
  'organization',
  'implementation plan',
  'contact',
];

/**
 * Like findField, but captures every line up to (not including) a blank
 * line or the next recognized label — a PDF/DOCX paragraph wraps across
 * several visual lines, so a single-line grab would truncate it mid-sentence.
 */
function findMultilineField(text: string, labels: string[]): string | null {
  const lines = text.split('\n');
  for (const label of labels) {
    const startRe = new RegExp(`^\\s*${label}\\s*[:\\-]\\s*(.*)$`, 'i');
    for (let i = 0; i < lines.length; i++) {
      const match = lines[i].match(startRe);
      if (!match) continue;
      const collected = [match[1].trim()];
      for (let j = i + 1; j < lines.length; j++) {
        const line = lines[j].trim();
        if (line === '') break;
        if (ALL_LABELS.some((l) => new RegExp(`^${l}\\s*[:\\-]`, 'i').test(line))) break;
        collected.push(line);
      }
      const result = collected.filter(Boolean).join(' ').trim();
      if (result) return result;
    }
  }
  return null;
}

function parseAmount(raw: string | null): number | null {
  if (!raw) return null;
  const cleaned = raw.replace(/[₹,]/g, '').replace(/rs\.?/i, '').trim();
  const match = cleaned.match(/([\d.]+)\s*(lakh|lac|crore|cr)?/i);
  if (!match) return null;
  let value = parseFloat(match[1]);
  if (Number.isNaN(value)) return null;
  const unit = match[2]?.toLowerCase();
  if (unit === 'lakh' || unit === 'lac') value *= 100_000;
  if (unit === 'crore' || unit === 'cr') value *= 10_000_000;
  return Math.round(value);
}

function guessDomain(text: string): string {
  const lower = text.toLowerCase();
  for (const [keyword, domain] of Object.entries(DOMAIN_KEYWORDS)) {
    if (lower.includes(keyword)) return domain;
  }
  return SUPPORTED_DOMAINS[0];
}

/**
 * Deterministic, regex-based field extraction — a pluggable stand-in for a
 * future LLM-backed parser. It never touches the FairFill scoring/allocation
 * engine; it only ever produces the same plain project fields a human would
 * type into the manual import form.
 */
export function extractProposalFields(text: string): ExtractedProposal {
  const name =
    findField(text, ['project name', 'project title', 'project', 'title']) ??
    text.split('\n').map((l) => l.trim()).find((l) => l.length > 0) ??
    null;

  if (!name) {
    throw ApiError.badRequest('Could not find a project name in this document. Please include a line like "Project Name: ...".');
  }

  const description =
    findMultilineField(text, ['description', 'summary', 'overview']) ??
    'Submitted via NGO proposal upload — see original document for full details.';

  const budgetRaw = findField(text, [
    'requested budget',
    'budget requested',
    'amount requested',
    'budget',
    'total cost',
    'funding requested',
  ]);
  const requestedBudget = parseAmount(budgetRaw) ?? 500_000;

  const impactRaw = findField(text, ['impact units', 'expected beneficiaries', 'beneficiaries', 'people impacted', 'households']);
  const impactUnits = parseAmount(impactRaw) ?? Math.round(requestedBudget / 700);

  const regionNameGuess = findField(text, ['region', 'location', 'district', 'area']);
  const domain = findField(text, ['domain', 'sector']) ? guessDomain(findField(text, ['domain', 'sector'])!) : guessDomain(text);

  const noteParts: string[] = [];
  if (!budgetRaw) noteParts.push('budget defaulted (not found in document)');
  if (!impactRaw) noteParts.push('impact units estimated from budget');
  if (!regionNameGuess) noteParts.push('no region stated — will use your NGO\'s home region');

  return {
    name,
    description,
    domain,
    requestedBudget,
    impactUnits,
    regionNameGuess,
    note: noteParts.length > 0 ? `Parsed with fallbacks: ${noteParts.join('; ')}.` : 'Parsed all fields directly from the document.',
  };
}

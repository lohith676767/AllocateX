import { prisma } from '../db/client.js';
import { standardTiers } from '../seed/seed.js';
import { ApiError } from '../utils/errors.js';
import { AuditEvents, logAudit } from './audit.js';
import { extractProposalFields, extractTextFromFile, type ExtractedProposal } from './proposalExtraction.js';

export async function submitProposal(
  ngoUserId: string,
  file: { buffer: Buffer; originalname: string; mimetype: string },
  companyIds: string[]
) {
  if (companyIds.length === 0) throw ApiError.badRequest('Select at least one company to send this proposal to.');

  const companies = await prisma.company.findMany({ where: { id: { in: companyIds } } });
  if (companies.length !== companyIds.length) throw ApiError.badRequest('One or more selected companies could not be found.');

  const text = await extractTextFromFile(file.buffer, file.originalname, file.mimetype);
  const extracted = extractProposalFields(text);

  // Duplicate guard: don't let the same NGO re-send a project with the same
  // name to a company that already has an undecided or accepted copy of it.
  const duplicate = await prisma.proposalRecipient.findFirst({
    where: {
      companyId: { in: companyIds },
      status: { in: ['PENDING', 'ACCEPTED'] },
      proposal: { ngoUserId, extractedJson: { contains: `"name":"${extracted.name}"` } },
    },
    include: { company: true },
  });
  if (duplicate) {
    throw ApiError.conflict(`You already have a ${duplicate.status.toLowerCase()} proposal named "${extracted.name}" with ${duplicate.company.name}.`);
  }

  const proposal = await prisma.proposal.create({
    data: {
      ngoUserId,
      filename: file.originalname,
      extractedJson: JSON.stringify(extracted),
      extractionNote: extracted.note,
      recipients: { create: companyIds.map((companyId) => ({ companyId })) },
    },
    include: { recipients: { include: { company: true } } },
  });

  await logAudit(
    AuditEvents.PROPOSAL_SUBMITTED,
    `Proposal "${extracted.name}" submitted to ${companies.map((c) => c.name).join(', ')}.`
  );

  return proposal;
}

export async function listSentProposals(ngoUserId: string) {
  return prisma.proposal.findMany({
    where: { ngoUserId },
    include: { recipients: { include: { company: true } } },
    orderBy: { createdAt: 'desc' },
  });
}

export async function listInboxForUser(userId: string) {
  const memberships = await prisma.companyUser.findMany({ where: { userId }, select: { companyId: true } });
  const companyIds = memberships.map((m) => m.companyId);
  if (companyIds.length === 0) return [];

  return prisma.proposalRecipient.findMany({
    where: { companyId: { in: companyIds } },
    include: {
      company: true,
      proposal: {
        include: {
          ngoUser: { select: { name: true, email: true, ngo: { select: { id: true, name: true } } } },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
}

async function assertRecipientBelongsToUser(recipientId: string, userId: string) {
  const recipient = await prisma.proposalRecipient.findUnique({
    where: { id: recipientId },
    include: { proposal: true },
  });
  if (!recipient) throw ApiError.notFound('Proposal not found');

  const membership = await prisma.companyUser.findUnique({
    where: { userId_companyId: { userId, companyId: recipient.companyId } },
  });
  if (!membership) throw ApiError.forbidden('This proposal was not sent to a company you represent.');

  return recipient;
}

/**
 * Accepting a proposal creates a real Project exactly the way the manual
 * data-import path does — same tier-fallback logic, same PROPOSED status —
 * so it flows into the next FairFill run untouched. The NGO and region are
 * resolved from the authenticated NGO's own profile, never from free text,
 * so acceptance can never fail on an unresolvable name.
 */
export async function acceptProposal(recipientId: string, userId: string) {
  const recipient = await assertRecipientBelongsToUser(recipientId, userId);
  if (recipient.status !== 'PENDING') {
    throw ApiError.conflict(`This proposal has already been ${recipient.status.toLowerCase()}`);
  }

  const proposal = await prisma.proposal.findUniqueOrThrow({
    where: { id: recipient.proposalId },
    include: { ngoUser: { include: { ngo: true } } },
  });
  const ngo = proposal.ngoUser.ngo;
  if (!ngo) throw ApiError.conflict('This NGO account is not linked to an NGO organization record.');

  const extracted: ExtractedProposal = JSON.parse(proposal.extractedJson);

  let region = extracted.regionNameGuess
    ? await prisma.region.findFirst({ where: { name: { contains: extracted.regionNameGuess } } })
    : null;
  if (!region) region = await prisma.region.findUniqueOrThrow({ where: { id: ngo.regionId } });

  const tiers = standardTiers(extracted.requestedBudget, extracted.impactUnits);

  const project = await prisma.project.create({
    data: {
      name: extracted.name,
      ngoId: ngo.id,
      regionId: region.id,
      domain: extracted.domain,
      description: extracted.description,
      requestedBudget: extracted.requestedBudget,
      impactUnits: extracted.impactUnits,
      status: 'PROPOSED',
      tiers: { create: tiers },
    },
  });

  await prisma.proposalRecipient.update({
    where: { id: recipientId },
    data: { status: 'ACCEPTED', decidedAt: new Date(), createdProjectId: project.id },
  });

  await logAudit(
    AuditEvents.PROPOSAL_ACCEPTED,
    `Proposal "${extracted.name}" from ${ngo.name} accepted and added as a project in ${region.name}, awaiting the next FairFill run.`
  );

  return { recipientId, project };
}

export async function rejectProposal(recipientId: string, userId: string) {
  const recipient = await assertRecipientBelongsToUser(recipientId, userId);
  if (recipient.status !== 'PENDING') {
    throw ApiError.conflict(`This proposal has already been ${recipient.status.toLowerCase()}`);
  }

  await prisma.proposalRecipient.update({
    where: { id: recipientId },
    data: { status: 'REJECTED', decidedAt: new Date() },
  });

  await logAudit(AuditEvents.PROPOSAL_REJECTED, `A proposal was rejected by a company reviewer.`);

  return prisma.proposalRecipient.findUnique({ where: { id: recipientId } });
}

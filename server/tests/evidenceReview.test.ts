import { beforeEach, describe, expect, it } from 'vitest';
import { prisma } from '../src/db/client.js';
import { seedDatabase } from '../src/seed/seed.js';
import { submitEvidence, reviewEvidence } from '../src/services/simulation/milestoneEngine.js';
import { ApiError } from '../src/utils/errors.js';

describe('evidence review', () => {
  beforeEach(async () => {
    await seedDatabase();
  });

  it('defaults new evidence to SUBMITTED and never auto-verifies it', async () => {
    const milestone = await prisma.milestone.findFirstOrThrow();
    const evidence = await submitEvidence(milestone.id, {
      filename: 'photo.jpg',
      description: 'Site visit',
      simulatedLocation: '0,0',
    });
    expect(evidence.reviewStatus).toBe('SUBMITTED');
  });

  it('lets a human reviewer mark evidence REVIEWED or FLAGGED', async () => {
    const milestone = await prisma.milestone.findFirstOrThrow();
    const evidence = await submitEvidence(milestone.id, {
      filename: 'photo.jpg',
      description: 'Site visit',
      simulatedLocation: '0,0',
    });

    const reviewed = await reviewEvidence(evidence.id, 'REVIEWED');
    expect(reviewed.reviewStatus).toBe('REVIEWED');

    const flagged = await reviewEvidence(evidence.id, 'FLAGGED');
    expect(flagged.reviewStatus).toBe('FLAGGED');
  });

  it('rejects an invalid review status', async () => {
    const milestone = await prisma.milestone.findFirstOrThrow();
    const evidence = await submitEvidence(milestone.id, {
      filename: 'photo.jpg',
      description: 'Site visit',
      simulatedLocation: '0,0',
    });
    // @ts-expect-error intentionally invalid status
    await expect(reviewEvidence(evidence.id, 'APPROVED')).rejects.toThrow(ApiError);
  });

  it('resets an existing evidence record back to SUBMITTED when re-uploaded', async () => {
    const milestone = await prisma.milestone.findFirstOrThrow();
    const evidence = await submitEvidence(milestone.id, {
      filename: 'photo.jpg',
      description: 'Site visit',
      simulatedLocation: '0,0',
    });
    await reviewEvidence(evidence.id, 'FLAGGED');

    const reuploaded = await submitEvidence(milestone.id, {
      filename: 'photo_v2.jpg',
      description: 'Corrected site visit',
      simulatedLocation: '0,0',
    });
    expect(reuploaded.reviewStatus).toBe('SUBMITTED');
  });
});

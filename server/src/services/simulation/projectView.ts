import { prisma } from '../../db/client.js';
import { ApiError } from '../../utils/errors.js';

export async function getProjectWithDetails(projectId: string) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      region: true,
      ngo: true,
      tiers: { orderBy: { order: 'asc' } },
      milestones: { orderBy: { order: 'asc' }, include: { evidence: true } },
      allocations: { orderBy: { createdAt: 'desc' } },
    },
  });
  if (!project) throw ApiError.notFound('Project not found');
  return project;
}

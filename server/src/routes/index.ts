import { Router } from 'express';
import { getDashboard } from '../controllers/dashboardController.js';
import { getRegion, listRegions } from '../controllers/regionController.js';
import { getProject, getProjectMilestones, listProjects } from '../controllers/projectController.js';
import { getComparison, getConfig, postRunFairFill } from '../controllers/fairfillController.js';
import { listAllocations, postApproveAllocation, postRejectAllocation } from '../controllers/allocationController.js';
import {
  postAdvanceSimulation,
  postFailMilestone,
  postJumpSimulation,
  postRewindSimulation,
} from '../controllers/simulationController.js';
import { postCompleteMilestone, postMilestoneEvidence } from '../controllers/milestoneController.js';
import {
  listReallocations,
  postApproveReallocation,
  postRejectReallocation,
} from '../controllers/reallocationController.js';
import { listAuditEvents } from '../controllers/auditController.js';
import { postResetDemo } from '../controllers/demoController.js';

export const router = Router();

router.get('/dashboard', getDashboard);
router.get('/config', getConfig);

router.get('/regions', listRegions);
router.get('/regions/:id', getRegion);

router.get('/projects', listProjects);
router.get('/projects/:id', getProject);
router.get('/projects/:id/milestones', getProjectMilestones);

router.post('/fairfill/run', postRunFairFill);
router.get('/fairfill/comparison', getComparison);

router.get('/allocations', listAllocations);
router.post('/allocations/:id/approve', postApproveAllocation);
router.post('/allocations/:id/reject', postRejectAllocation);

router.post('/simulation/:projectId/advance', postAdvanceSimulation);
router.post('/simulation/:projectId/rewind', postRewindSimulation);
router.post('/simulation/:projectId/jump', postJumpSimulation);
router.post('/simulation/:projectId/fail-milestone', postFailMilestone);

router.post('/milestones/:id/complete', postCompleteMilestone);
router.post('/milestones/:id/evidence', postMilestoneEvidence);

router.get('/reallocations', listReallocations);
router.post('/reallocations/:id/approve', postApproveReallocation);
router.post('/reallocations/:id/reject', postRejectReallocation);

router.get('/audit', listAuditEvents);

router.post('/demo/reset', postResetDemo);

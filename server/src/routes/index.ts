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
import { postCompleteMilestone, postMilestoneEvidence, postReviewEvidence } from '../controllers/milestoneController.js';
import {
  listReallocations,
  postApproveReallocation,
  postRejectReallocation,
} from '../controllers/reallocationController.js';
import { listAuditEvents } from '../controllers/auditController.js';
import { postResetDemo } from '../controllers/demoController.js';
import { postImportData } from '../controllers/importController.js';
import { getMe, postLogin, postLogout } from '../controllers/authController.js';
import { listCompanies } from '../controllers/companyController.js';
import {
  getInbox,
  getSentProposals,
  postAcceptProposal,
  postPreviewProposal,
  postRejectProposal,
  postSubmitProposal,
} from '../controllers/proposalController.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { uploadProposal } from '../middleware/upload.js';

export const router = Router();

const company = [requireAuth, requireRole('COMPANY')];
const ngo = [requireAuth, requireRole('NGO')];

// ── Auth (login is public; everything else needs a session) ────────────
router.post('/auth/login', postLogin);
router.post('/auth/logout', postLogout);
router.get('/auth/me', requireAuth, getMe);

router.get('/companies', requireAuth, listCompanies);

// ── NGO proposal submission ─────────────────────────────────────────
router.post('/proposals/preview', ...ngo, uploadProposal, postPreviewProposal);
router.post('/proposals', ...ngo, postSubmitProposal);
router.get('/proposals/sent', ...ngo, getSentProposals);

// ── Company proposal inbox ──────────────────────────────────────────
router.get('/proposals/inbox', ...company, getInbox);
router.post('/proposals/:id/accept', ...company, postAcceptProposal);
router.post('/proposals/:id/reject', ...company, postRejectProposal);

// ── Existing FairFill application (Company role only) ───────────────
router.get('/dashboard', ...company, getDashboard);
router.get('/config', ...company, getConfig);

router.get('/regions', ...company, listRegions);
router.get('/regions/:id', ...company, getRegion);

router.get('/projects', ...company, listProjects);
router.get('/projects/:id', ...company, getProject);
router.get('/projects/:id/milestones', ...company, getProjectMilestones);

router.post('/fairfill/run', ...company, postRunFairFill);
router.get('/fairfill/comparison', ...company, getComparison);

router.get('/allocations', ...company, listAllocations);
router.post('/allocations/:id/approve', ...company, postApproveAllocation);
router.post('/allocations/:id/reject', ...company, postRejectAllocation);

router.post('/simulation/:projectId/advance', ...company, postAdvanceSimulation);
router.post('/simulation/:projectId/rewind', ...company, postRewindSimulation);
router.post('/simulation/:projectId/jump', ...company, postJumpSimulation);
router.post('/simulation/:projectId/fail-milestone', ...company, postFailMilestone);

router.post('/milestones/:id/complete', ...company, postCompleteMilestone);
router.post('/milestones/:id/evidence', ...company, postMilestoneEvidence);
router.post('/evidence/:id/review', ...company, postReviewEvidence);

router.get('/reallocations', ...company, listReallocations);
router.post('/reallocations/:id/approve', ...company, postApproveReallocation);
router.post('/reallocations/:id/reject', ...company, postRejectReallocation);

router.get('/audit', ...company, listAuditEvents);

router.post('/demo/reset', ...company, postResetDemo);
router.post('/import', ...company, postImportData);

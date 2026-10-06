import { Router } from 'express';
import { probeController } from './probe.controller.js';
import { requireProbeAuth } from './probe.auth.js';
import { requireAuth, requireRole } from '../../middleware/auth.middleware.js';

const router = Router();

// ==========================================
// 1. Remote Probe Protocol Endpoints (Bearer Probe Token)
// ==========================================
router.post('/heartbeat', requireProbeAuth, probeController.heartbeat);
router.get('/assignments', requireProbeAuth, probeController.getAssignments);
router.post('/assignments/:id/results', requireProbeAuth, probeController.submitResult);

// ==========================================
// 2. User Visibility (Authenticated User)
// ==========================================
router.get('/fleet', requireAuth, probeController.getFleet);

// ==========================================
// 3. Operator Administration (Admin Role Only)
// ==========================================
router.get('/admin', requireAuth, requireRole('ADMIN'), probeController.listProbes);
router.post('/admin/enroll', requireAuth, requireRole('ADMIN'), probeController.enroll);
router.post('/admin/:id/rotate-token', requireAuth, requireRole('ADMIN'), probeController.rotateToken);
router.post('/admin/:id/revoke', requireAuth, requireRole('ADMIN'), probeController.revoke);

export default router;

import { Router } from 'express';
import { recoveryController } from './recovery.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';

const router = Router();

// Agent execution result route (authenticated via X-NetScope-Agent-Key header)
router.post('/result', recoveryController.processResult);

// User-authenticated recovery routes
router.use(authenticate);

router.post('/recommend', recoveryController.createRequest);
router.post('/requests', recoveryController.createRequest);
router.post('/:id/approve', recoveryController.approveAction);
router.post('/:id/verify', recoveryController.verifyAction);

router.get('/device/:deviceId', recoveryController.getDeviceActions);
router.get('/audit-logs', recoveryController.getAuditLogs);

export default router;

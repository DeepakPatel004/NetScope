import { Router } from 'express';
import { aiController } from './ai.controller.js';
import { requireAuth } from '../../middleware/auth.middleware.js';

const router = Router();

router.post('/explain/ssl/:deviceId', requireAuth, aiController.explainSsl);
router.post('/explain/ports/:deviceId', requireAuth, aiController.explainPorts);
router.post('/explain/health/:deviceId', requireAuth, aiController.explainHealth);
router.post('/analyze/device/:deviceId', requireAuth, aiController.analyzeDevice);
router.post('/explain/report/:reportId', requireAuth, aiController.explainReport);

export default router;

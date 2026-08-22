import { Router } from 'express';
import { aiController } from './ai.controller.js';
import { requireAuth } from '../../middleware/auth.middleware.js';

const router = Router();

router.post('/explain/ssl/:deviceId', requireAuth, aiController.explainSsl);
router.post('/explain/ports/:deviceId', requireAuth, aiController.explainPorts);
router.post('/explain/health/:deviceId', requireAuth, aiController.explainHealth);
router.post('/analyze/device/:deviceId', requireAuth, aiController.analyzeDevice);
router.post('/explain/report/:reportId', requireAuth, aiController.explainReport);

router.get('/anomalies', requireAuth, aiController.getAnomalies);
router.get('/incidents', requireAuth, aiController.getIncidents);
router.post('/incidents/:deviceId/analyze', requireAuth, aiController.triggerIncidentAnalysis);
router.get('/timeline/:deviceId', requireAuth, aiController.getTimelineSummary);
router.post('/playbook/:deviceId', requireAuth, aiController.generatePlaybook);

export default router;

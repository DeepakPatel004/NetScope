import { Router } from 'express';
import { analyticsController } from './analytics.controller.js';
import { requireAuth } from '../../middleware/auth.middleware.js';

const router = Router();

router.get('/:deviceId', requireAuth, analyticsController.getMetrics);

export default router;
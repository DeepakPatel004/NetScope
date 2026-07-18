import { Router } from 'express';
import { analyticsController } from './analytics.controller.js';

const router = Router();

router.get('/:deviceId', analyticsController.getMetrics);

export default router;
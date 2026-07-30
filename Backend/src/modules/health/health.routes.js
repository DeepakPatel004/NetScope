import express from 'express';
import { healthController } from './health.controller.js';
import { requireAuth } from '../../middleware/auth.middleware.js';

const router = express.Router();

// GET /api/v3/health/:deviceId
router.get('/:deviceId', requireAuth, healthController.getHistory);

// POST /api/v3/health/check/:deviceId
router.post('/check/:deviceId', requireAuth, healthController.triggerManualCheck);

export default router;
import express from 'express';
import { healthController } from './health.controller.js';

const router = express.Router();

// GET /api/v1/health/:deviceId
router.get('/:deviceId', healthController.getHistory);

// POST /api/v1/health/check/:deviceId
router.post('/check/:deviceId', healthController.triggerManualCheck);

export default router;
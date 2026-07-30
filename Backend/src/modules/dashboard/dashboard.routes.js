import express from 'express';
import { dashboardController } from './dashboard.controller.js';
import { requireAuth } from '../../middleware/auth.middleware.js';

const router = express.Router();

router.get('/summary', requireAuth, dashboardController.getSummary);
router.get('/devices', requireAuth, dashboardController.getDevicesStatus);
router.get('/device/:id', requireAuth, dashboardController.getDeviceDetails);

export default router;
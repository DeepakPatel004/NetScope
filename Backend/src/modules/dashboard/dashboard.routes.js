import express from 'express';
import { dashboardController } from './dashboard.controller.js';

const router = express.Router();

router.get('/summary', dashboardController.getSummary);
router.get('/devices', dashboardController.getDevicesStatus);
router.get('/device/:id', dashboardController.getDeviceDetails);

export default router;
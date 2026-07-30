import express from 'express';
import { reportController } from './report.controller.js';
import { requireAuth } from '../../middleware/auth.middleware.js';

const router = express.Router();

router.get('/csv', requireAuth, reportController.getReportCsv);
router.get('/pdf', requireAuth, reportController.getReportPdf);

export default router;

import express from 'express';
import { reportController } from './report.controller.js';
import { requireAuth } from '../../middleware/auth.middleware.js';
import { reportService } from './report.service.js';

const router = express.Router();

router.get('/', requireAuth, async (req, res, next) => {
  try { res.json({ success: true, data: await reportService.getReportData(req.user.id) }); }
  catch (error) { next(error); }
});

router.get('/csv', requireAuth, reportController.getReportCsv);
router.get('/pdf', requireAuth, reportController.getReportPdf);

export default router;

import { analyticsService } from './analytics.service.js';

export const analyticsController = {
  async getMetrics(req, res, next) {
    try {
      const { deviceId } = req.params;
      const hours = req.query.hours ? parseInt(req.query.hours, 10) : 24;

      const metrics = await analyticsService.getDeviceMetrics(deviceId, hours);

      return res.status(200).json({ success: true, data: metrics });
    } catch (error) {
      next(error);
    }
  }
};
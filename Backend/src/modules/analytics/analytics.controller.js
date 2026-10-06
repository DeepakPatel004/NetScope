import { deviceService } from '../device/device.service.js';
import { analyticsService } from './analytics.service.js';

export const analyticsController = {
  async getMetrics(req, res, next) {
    try {
      const { deviceId } = req.params;
      const hours = req.query.hours ? parseInt(req.query.hours, 10) : 24;

      const device = await deviceService.getDeviceById(req.user.id, deviceId);
      if (!device) return res.status(404).json({ success: false, message: 'Device not found' });
      if (!Number.isFinite(hours) || hours <= 0 || hours > 8760) return res.status(400).json({ success: false, message: 'Invalid time window' });
      const metrics = await analyticsService.getDeviceMetrics(deviceId, hours);

      return res.status(200).json({ success: true, data: metrics });
    } catch (error) {
      next(error);
    }
  }
};
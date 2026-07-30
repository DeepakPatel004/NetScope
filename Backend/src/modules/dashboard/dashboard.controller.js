import { dashboardService } from './dashboard.service.js';

export const dashboardController = {
  async getSummary(req, res, next) {
    try {
      const userId = req.user?.id;
      if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

      const summary = await dashboardService.getSummary(userId);
      return res.status(200).json({ success: true, data: summary });
    } catch (error) {
      next(error);
    }
  },

  async getDevicesStatus(req, res, next) {
    try {
      const userId = req.user?.id;
      if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

      const devices = await dashboardService.getDevicesStatus(userId);
      return res.status(200).json({ success: true, data: devices });
    } catch (error) {
      next(error);
    }
  },

  async getDeviceDetails(req, res, next) {
    try {
      const { id } = req.params;
      const details = await dashboardService.getDeviceDetails(id);
      
      if (!details) {
        return res.status(404).json({ success: false, message: 'Device not found' });
      }

      return res.status(200).json({ success: true, data: details });
    } catch (error) {
      next(error);
    }
  },
};
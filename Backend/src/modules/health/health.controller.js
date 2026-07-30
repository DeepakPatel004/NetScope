import { healthService } from './health.service.js';
import { deviceService } from '../device/device.service.js';
import { healthQueue, QUEUE_NAMES } from '../../config/queue.js';

// NOTE: This controller expects authentication middleware to set `req.user.id`

export const healthController = {
  /**
   * Get the health history for a specific device
   * GET /api/v3/health/:deviceId
   */
  async getHistory(req, res, next) {
    try {
      const { deviceId } = req.params;

      const userId = req.user?.id;
      if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

      // 1. Verify the device actually belongs to this user
      const device = await deviceService.getDeviceById(userId, deviceId);
      if (!device) {
        return res.status(404).json({ success: false, message: 'Device not found' });
      }

      // 2. Fetch the logs
      const history = await healthService.getDeviceHealthHistory(deviceId);

      return res.status(200).json({ success: true, data: history });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Manually trigger a check (Great for testing!)
   * POST /api/v3/health/check/:deviceId
   */
  async triggerManualCheck(req, res, next) {
    try {
      const { deviceId } = req.params;

      const userId = req.user?.id;
      if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

      const device = await deviceService.getDeviceById(userId, deviceId);
      if (!device) {
        return res.status(404).json({ success: false, message: 'Device not found' });
      }

      // Push a job to BullMQ manually, bypassing the 1-minute scheduler
      await healthQueue.add(QUEUE_NAMES.HEALTH_CHECK, {
        deviceId: device.id,
        host: device.host,
        type: device.type,
      });

      // 202 Accepted means "I got the request and it is processing in the background"
      return res.status(202).json({ 
        success: true, 
        message: 'Manual health check queued' 
      });
    } catch (error) {
      next(error);
    }
  },
};






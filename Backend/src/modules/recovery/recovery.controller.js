import { recoveryService } from './recovery.service.js';

export const recoveryController = {
  async createRequest(req, res, next) {
    try {
      const userId = req.user.id;
      const action = await recoveryService.createRecoveryRequest(userId, req.body);
      res.json({ success: true, data: action });
    } catch (error) {
      next(error);
    }
  },

  async approveAction(req, res, next) {
    try {
      const userId = req.user.id;
      const { id } = req.params;
      const result = await recoveryService.approveAction(userId, id);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },

  async processResult(req, res, next) {
    try {
      const agentKey = req.headers['x-netscope-agent-key'];
      if (!agentKey) {
        return res.status(401).json({ success: false, message: 'Missing agent key header' });
      }
      const result = await recoveryService.processExecutionResult(agentKey, req.body);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },

  async verifyAction(req, res, next) {
    try {
      const userId = req.user.id;
      const { id } = req.params;
      const result = await recoveryService.verifyRecovery(userId, id);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },

  async getDeviceActions(req, res, next) {
    try {
      const { deviceId } = req.params;
      const actions = await recoveryService.getRecoveryActions(deviceId);
      res.json({ success: true, data: actions });
    } catch (error) {
      next(error);
    }
  },

  async getAuditLogs(req, res, next) {
    try {
      const userId = req.user.id;
      const limit = Number(req.query.limit) || 50;
      const logs = await recoveryService.getAuditLogs(userId, limit);
      res.json({ success: true, data: logs });
    } catch (error) {
      next(error);
    }
  },
};

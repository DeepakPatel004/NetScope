import { agentService } from './agent.service.js';

export const agentController = {
  async registerAgent(req, res, next) {
    try {
      const userId = req.user.id;
      const { deviceId } = req.body;
      const result = await agentService.registerAgent(userId, deviceId);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },

  async ingestHeartbeat(req, res, next) {
    try {
      const headerKey = req.headers['x-netscope-agent-key'];
      const { agentKey, metrics, timestamp, ...extraPayload } = req.body;
      const key = agentKey || headerKey;

      if (!key) {
        return res.status(400).json({ success: false, error: 'Agent key is required' });
      }

      const result = await agentService.ingestHeartbeat(key, metrics, timestamp, extraPayload);
      res.json(result);
    } catch (error) {
      res.status(401).json({ success: false, error: error.message });
    }
  },

  async getDiscoveredServices(req, res, next) {
    try {
      const userId = req.user.id;
      const { deviceId } = req.params;
      const result = await agentService.getDiscoveredServices(userId, deviceId);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },

  async setPrimaryService(req, res, next) {
    try {
      const userId = req.user.id;
      const { deviceId } = req.params;
      const { serviceName } = req.body;
      const result = await agentService.setPrimaryService(userId, deviceId, serviceName);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },

  async getAgentMetrics(req, res, next) {
    try {
      const userId = req.user.id;
      const { deviceId } = req.params;
      const hours = Number(req.query.hours) || 24;
      const result = await agentService.getAgentMetrics(userId, deviceId, hours);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },
};

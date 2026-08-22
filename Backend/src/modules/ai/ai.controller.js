import { aiService } from './ai.service.js';

export const aiController = {
  async explainSsl(req, res, next) {
    try {
      const result = await aiService.explainSsl(req.user?.id, req.params.deviceId, req.body?.prompt || '');
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  },

  async explainPorts(req, res, next) {
    try {
      const result = await aiService.explainPorts(req.user?.id, req.params.deviceId, req.body?.prompt || '');
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  },

  async explainHealth(req, res, next) {
    try {
      const result = await aiService.explainHealth(req.user?.id, req.params.deviceId, req.body?.prompt || '');
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  },

  async analyzeDevice(req, res, next) {
    try {
      const result = await aiService.analyzeDevice(req.user?.id, req.params.deviceId, req.body?.prompt || '');
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  },

  async explainReport(req, res, next) {
    try {
      const result = await aiService.explainReport(req.user?.id, req.params.reportId);
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  },

  async getAnomalies(req, res, next) {
    try {
      const deviceId = req.query.deviceId || null;
      const anomalies = await aiService.getAnomalies(req.user?.id, deviceId);
      return res.status(200).json({ success: true, data: anomalies });
    } catch (error) {
      next(error);
    }
  },

  async getIncidents(req, res, next) {
    try {
      const incidents = await aiService.getIncidents(req.user?.id);
      return res.status(200).json({ success: true, data: incidents });
    } catch (error) {
      next(error);
    }
  },

  async triggerIncidentAnalysis(req, res, next) {
    try {
      const result = await aiService.triggerDeviceIncidentAnalysis(req.user?.id, req.params.deviceId);
      return res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },

  async getTimelineSummary(req, res, next) {
    try {
      const result = await aiService.generateDeviceTimelineSummary(req.user?.id, req.params.deviceId);
      return res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },

  async generatePlaybook(req, res, next) {
    try {
      const result = await aiService.generatePlaybook(req.user?.id, req.params.deviceId, req.body || {});
      return res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },
};

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
};

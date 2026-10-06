import { probeService } from './probe.service.js';

export const probeController = {
  /**
   * Probe Endpoint: Fetches and leases check assignments.
   */
  async getAssignments(req, res, next) {
    try {
      const limit = Math.min(Number(req.query.limit) || 10, 50);
      const assignments = await probeService.leaseAssignments(req.probe.id, limit);
      res.json({
        success: true,
        count: assignments.length,
        assignments,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Probe Endpoint: Submits check result.
   */
  async submitResult(req, res, next) {
    try {
      const { id } = req.params;
      const outcome = await probeService.recordResult(req.probe, id, req.body);
      res.status(outcome.isDuplicate ? 200 : 201).json(outcome);
    } catch (error) {
      if (error.statusCode) {
        return res.status(error.statusCode).json({ success: false, message: error.message });
      }
      next(error);
    }
  },

  /**
   * Probe Endpoint: Process heartbeat.
   */
  async heartbeat(req, res, next) {
    try {
      const updated = await probeService.recordHeartbeat(req.probe.id, req.body);
      res.json({
        success: true,
        probe: {
          id: updated.id,
          name: updated.name,
          region: updated.region,
          status: updated.status,
          lastHeartbeatAt: updated.lastHeartbeatAt,
        },
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * User/Operator: Get fleet overview.
   */
  async getFleet(req, res, next) {
    try {
      const fleet = await probeService.getFleetOverview();
      res.json({ success: true, data: fleet });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Operator: Enroll new probe.
   */
  async enroll(req, res, next) {
    try {
      const { name, region } = req.body;
      if (!name || !region) {
        return res.status(400).json({ success: false, message: 'Both name and region are required.' });
      }
      const enrolled = await probeService.enrollProbe({ name, region });
      res.status(201).json({ success: true, data: enrolled });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Operator: Rotate probe token.
   */
  async rotateToken(req, res, next) {
    try {
      const { id } = req.params;
      const rotated = await probeService.rotateToken(id);
      res.json({ success: true, data: rotated });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Operator: Revoke probe credentials.
   */
  async revoke(req, res, next) {
    try {
      const { id } = req.params;
      await probeService.revokeProbe(id);
      res.json({ success: true, message: 'Probe credentials successfully revoked.' });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Operator: List all probes.
   */
  async listProbes(req, res, next) {
    try {
      const probes = await probeService.listProbes();
      res.json({ success: true, data: probes });
    } catch (error) {
      next(error);
    }
  },
};

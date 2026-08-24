import prisma from '../../config/database.js';
import redisConnection from '../../config/redis.js';
import crypto from 'crypto';

export const agentService = {
  async registerAgent(userId, deviceId) {
    const device = await prisma.device.findFirst({
      where: { id: deviceId, userId },
    });

    if (!device) {
      throw new Error('Device not found or access denied');
    }

    const agentKey = `agent_${crypto.randomBytes(16).toString('hex')}`;

    const updatedDevice = await prisma.device.update({
      where: { id: deviceId },
      data: {
        agentKey,
        type: 'SERVER',
        metricsSource: 'NETSCOPE_AGENT',
        agentStatus: 'NOT_CONNECTED',
      },
    });

    return {
      deviceId: updatedDevice.id,
      deviceName: updatedDevice.name,
      agentKey: updatedDevice.agentKey,
      agentStatus: updatedDevice.agentStatus,
      installCommand: `python agent/agent.py --server=http://localhost:5000 --key=${updatedDevice.agentKey}`,
    };
  },

  async ingestHeartbeat(agentKey, metrics, timestamp, extraPayload = {}) {
    const device = await prisma.device.findUnique({
      where: { agentKey },
    });

    if (!device) {
      throw new Error('Invalid or unregistered agent key');
    }

    const checkedAt = timestamp ? new Date(timestamp) : new Date();

    // Cache discovered systemd services in Redis for telemetry visibility
    if (extraPayload.discoveredServices && Array.isArray(extraPayload.discoveredServices)) {
      const redisKey = `agent_discovered_services:${device.id}`;
      await redisConnection.set(redisKey, JSON.stringify(extraPayload.discoveredServices), 'EX', 86400).catch(() => null);
    }

    // Prepare update data for Docker & Capabilities discovery
    const deviceUpdateData = {
      agentStatus: 'ONLINE',
      lastSeen: checkedAt,
    };

    if (extraPayload.dockerStatus) deviceUpdateData.dockerStatus = extraPayload.dockerStatus;
    if (extraPayload.containers) deviceUpdateData.containers = extraPayload.containers;
    if (extraPayload.dockerComposeProjects) deviceUpdateData.dockerComposeProjects = extraPayload.dockerComposeProjects;
    if (extraPayload.capabilities) deviceUpdateData.capabilities = extraPayload.capabilities;

    const sanitizeMetric = (val, min = 0, max = 100) => {
      if (val === null || val === undefined || isNaN(val) || !isFinite(val)) return 0;
      return Math.min(Math.max(Number(val), min), max);
    };

    const [metricRecord] = await Promise.all([
      prisma.agentMetric.create({
        data: {
          deviceId: device.id,
          cpuPercent: sanitizeMetric(metrics.cpuPercent, 0, 100),
          ramPercent: sanitizeMetric(metrics.ramPercent, 0, 100),
          ramUsedMb: sanitizeMetric(metrics.ramUsedMb, 0, 1000000),
          ramTotalMb: sanitizeMetric(metrics.ramTotalMb, 0, 1000000),
          diskPercent: sanitizeMetric(metrics.diskPercent, 0, 100),
          diskUsedGb: sanitizeMetric(metrics.diskUsedGb, 0, 1000000),
          diskTotalGb: sanitizeMetric(metrics.diskTotalGb, 0, 1000000),
          loadAvg: sanitizeMetric(metrics.loadAvg, 0, 1000),
          netBytesSent: sanitizeMetric(metrics.netBytesSent, 0, 1e15),
          netBytesRecv: sanitizeMetric(metrics.netBytesRecv, 0, 1e15),
          checkedAt,
        },
      }),
      prisma.device.update({
        where: { id: device.id },
        data: deviceUpdateData,
      }),
    ]);

    // Check if there is an APPROVED RecoveryAction waiting to be dispatched to this Agent
    const pendingApprovedAction = await prisma.recoveryAction.findFirst({
      where: {
        deviceId: device.id,
        status: 'APPROVED',
      },
      orderBy: { createdAt: 'desc' },
    });

    let pendingActionPayload = null;
    if (pendingApprovedAction) {
      // Transition action to EXECUTING
      await prisma.recoveryAction.update({
        where: { id: pendingApprovedAction.id },
        data: {
          status: 'EXECUTING',
          executedAt: new Date(),
        },
      });

      pendingActionPayload = {
        id: pendingApprovedAction.id,
        actionType: pendingApprovedAction.actionType,
        targetName: pendingApprovedAction.targetName,
        cliCommand: pendingApprovedAction.cliCommand || `docker restart ${pendingApprovedAction.targetName}`,
      };
    }

    return {
      success: true,
      deviceId: device.id,
      agentStatus: 'ONLINE',
      metricId: metricRecord.id,
      pendingAction: pendingActionPayload,
    };
  },

  async getDiscoveredServices(userId, deviceId) {
    const device = await prisma.device.findFirst({
      where: { id: deviceId, userId },
    });

    if (!device) {
      throw new Error('Device not found or access denied');
    }

    const redisKey = `agent_discovered_services:${deviceId}`;
    const rawJson = await redisConnection.get(redisKey).catch(() => null);

    let services = ["nginx.service", "postgresql.service", "redis.service"];
    if (rawJson) {
      try {
        services = JSON.parse(rawJson);
      } catch {
        // Fallback default
      }
    }

    return {
      deviceId: device.id,
      discoveredServices: services,
      dockerStatus: device.dockerStatus || "NOT_INSTALLED",
      containers: device.containers || [],
      dockerComposeProjects: device.dockerComposeProjects || [],
      capabilities: device.capabilities || ["restart_container", "restart_compose_service"]
    };
  },

  async getAgentMetrics(userId, deviceId, hours = 24) {
    const device = await prisma.device.findFirst({
      where: { id: deviceId, userId },
    });

    if (!device) {
      throw new Error('Device not found or access denied');
    }

    const since = new Date(Date.now() - hours * 60 * 60 * 1000);

    const metrics = await prisma.agentMetric.findMany({
      where: {
        deviceId,
        checkedAt: { gte: since },
      },
      orderBy: { checkedAt: 'asc' },
      take: 200,
    });

    return {
      device: {
        id: device.id,
        name: device.name,
        host: device.host,
        agentStatus: device.agentStatus,
        lastSeen: device.lastSeen,
        metricsSource: device.metricsSource,
        dockerStatus: device.dockerStatus,
        containers: device.containers,
        dockerComposeProjects: device.dockerComposeProjects,
        capabilities: device.capabilities
      },
      metrics,
    };
  },

  async checkOfflineAgents() {
    const threeMinutesAgo = new Date(Date.now() - 3 * 60 * 1000);

    const staleAgents = await prisma.device.findMany({
      where: {
        agentKey: { not: null },
        agentStatus: 'ONLINE',
        lastSeen: { lt: threeMinutesAgo },
      },
    });

    for (const device of staleAgents) {
      await prisma.device.update({
        where: { id: device.id },
        data: { agentStatus: 'OFFLINE' },
      });

      // Automatically register Incident for Agent Heartbeat Loss
      try {
        await incidentService.createIncident({
          deviceId: device.id,
          title: `Agent Heartbeat Lost: ${device.name}`,
          description: `NetScope Agent on ${device.host} missed heartbeats for >3 minutes. Host telemetry streaming interrupted.`,
          severity: 'HIGH',
          possibleCauses: [
            'Agent daemon python process terminated',
            'Host server firewall or network connection lost',
            'Target host server restarted'
          ],
          recommendedActions: [
            'Verify python agent.py process is running on target host',
            'Restart NetScope Agent daemon via terminal',
            'Check host network outbound connectivity to port 5000'
          ]
        });
      } catch (err) {}

      console.warn(`[AgentService] Server ${device.name} (${device.host}) marked OFFLINE due to missed heartbeats.`);
    }

    return staleAgents.length;
  },
};

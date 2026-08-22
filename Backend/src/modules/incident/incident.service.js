import prisma from '../../config/database.js';

export const incidentService = {
  /**
   * Open an incident with AI priority & structured LLM analysis context
   */
  async openIncident(deviceId, type = 'DOWNTIME', errorMsg = null, aiData = {}) {
    const existingIncident = await prisma.incident.findFirst({
      where: {
        deviceId,
        status: 'OPEN',
      },
    });

    const updatePayload = {
      type,
      error: errorMsg || existingIncident?.error || 'Degraded monitoring status',
      priority: aiData.severity || existingIncident?.priority || 'MEDIUM',
      priorityScore: aiData.priorityScore ?? existingIncident?.priorityScore ?? 5.0,
      priorityReason: aiData.priorityReason || existingIncident?.priorityReason || null,
      summary: aiData.incident_summary || existingIncident?.summary || null,
      possibleCauses: aiData.possible_causes || existingIncident?.possibleCauses || [],
      recommendedActions: aiData.recommended_investigations || existingIncident?.recommendedActions || [],
      confidence: aiData.confidence ?? existingIncident?.confidence ?? 0.8,
      anomalyId: aiData.anomalyId || existingIncident?.anomalyId || null,
    };

    if (existingIncident) {
      const updated = await prisma.incident.update({
        where: { id: existingIncident.id },
        data: updatePayload,
      });
      return updated;
    }

    const newIncident = await prisma.incident.create({
      data: {
        deviceId,
        status: 'OPEN',
        openedAt: new Date(),
        ...updatePayload,
      },
    });

    console.log(`🚨 [INCIDENT OPENED] Device ${deviceId} | Type: ${type} | Priority: ${newIncident.priority}`);
    return newIncident;
  },

  async resolveIncident(deviceId) {
    const openIncidents = await prisma.incident.findMany({
      where: {
        deviceId,
        status: 'OPEN',
      },
    });

    if (!openIncidents || openIncidents.length === 0) {
      return null;
    }

    const resolved = [];
    for (const incident of openIncidents) {
      const res = await prisma.incident.update({
        where: { id: incident.id },
        data: {
          status: 'RESOLVED',
          resolvedAt: new Date(),
        },
      });
      resolved.push(res);
      console.log(`✅ [INCIDENT RESOLVED] Device ${deviceId} | Incident ID: ${incident.id}`);
    }

    return resolved;
  },

  async getDeviceIncidents(deviceId, limit = 20) {
    return prisma.incident.findMany({
      where: { deviceId },
      orderBy: { openedAt: 'desc' },
      take: limit,
      include: {
        anomaly: true,
        device: {
          select: { id: true, name: true, host: true },
        },
      },
    });
  },

  async getActiveIncidents() {
    return prisma.incident.findMany({
      where: { status: 'OPEN' },
      orderBy: [{ priorityScore: 'desc' }, { openedAt: 'desc' }],
      include: {
        anomaly: true,
        device: {
          select: { id: true, name: true, host: true },
        },
      },
    });
  },
};
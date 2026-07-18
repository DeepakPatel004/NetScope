import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const incidentService = {
  /**
   * State Transition: OPERATIONAL -> INCIDENT_OPEN
   */
  async openIncident(deviceId, type = 'DOWNTIME', errorMsg = null) {
    // 1. Check if an incident is already open (Idempotency)
    const existingIncident = await prisma.incident.findFirst({
      where: {
        deviceId,
        type,
        status: 'OPEN'
      }
    });

    if (existingIncident) {
      return existingIncident;
    }

    // 2. Create the new Incident
    const newIncident = await prisma.incident.create({
      data: {
        deviceId,
        type,
        status: 'OPEN',
        error: errorMsg,
        openedAt: new Date(),
      }
    });

    console.log(`🚨 [INCIDENT OPENED] Device ${deviceId} | Type: ${type}`);
    return newIncident;
  },

  /**
   * State Transition: INCIDENT_OPEN -> OPERATIONAL
   */
  async resolveIncident(deviceId, type = 'DOWNTIME') {
    // 1. Find the currently open incident
    const openIncident = await prisma.incident.findFirst({
      where: {
        deviceId,
        type,
        status: 'OPEN'
      }
    });

    if (!openIncident) {
      return null;
    }

    // 2. Mark it as resolved
    const resolvedIncident = await prisma.incident.update({
      where: { id: openIncident.id },
      data: {
        status: 'RESOLVED',
        resolvedAt: new Date(),
      }
    });

    console.log(`✅ [INCIDENT RESOLVED] Device ${deviceId} | Type: ${type}`);
    return resolvedIncident;
  }
};
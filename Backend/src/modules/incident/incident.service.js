import prisma from '../../config/database.js';

export const incidentService = {
  async list(userId, deviceId = null) {
    return prisma.incident.findMany({
      where: { device: { userId }, ...(deviceId ? { deviceId } : {}) },
      include: { device: { select: { id: true, name: true, host: true, type: true } } },
      orderBy: { openedAt: 'desc' },
      take: 100,
    });
  },
};

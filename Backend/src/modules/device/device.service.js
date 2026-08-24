import prisma from "../../config/database.js";

export const deviceService = {
  // Create a new Device
  async createDevice(userId, deviceData) {
    const { name, host, type, interval = 30, enabled = true, agentKey, agentStatus, metricsSource } = deviceData;

    return await prisma.device.create({
      data: {
        userId,
        name,
        host,
        type: type || 'WEBSITE',
        interval: Number(interval) || 30,
        enabled: enabled ?? true,
        ...(agentKey ? { agentKey } : {}),
        ...(agentStatus ? { agentStatus } : {}),
        ...(metricsSource ? { metricsSource } : {}),
      }
    });
  },

  // Get All devices for specific user
  async getDevices(userId) {
    return prisma.device.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  },

  // Get a single device by ID and user ID
  async getDeviceById(userId, id) {
    return prisma.device.findFirst({
      where: {
        id,
        userId,
      },
    });
  },

  // Update an existing device
  async updateDevice(userId, id, data) {
    const device = await this.getDeviceById(userId, id);
    if (!device) return null;

    const { name, host, type, interval, enabled, agentKey, agentStatus, metricsSource } = data;

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (host !== undefined) updateData.host = host;
    if (type !== undefined) updateData.type = type;
    if (interval !== undefined) updateData.interval = Number(interval);
    if (enabled !== undefined) updateData.enabled = enabled;
    if (agentKey !== undefined) updateData.agentKey = agentKey;
    if (agentStatus !== undefined) updateData.agentStatus = agentStatus;
    if (metricsSource !== undefined) updateData.metricsSource = metricsSource;

    return prisma.device.update({
      where: { id },
      data: updateData,
    });
  },

  // Delete a device
  async deleteDevice(userId, id) {
    const device = await this.getDeviceById(userId, id);
    if (!device) return null;

    return prisma.device.delete({
      where: { id },
    });
  },
};
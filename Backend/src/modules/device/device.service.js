import prisma from "../../config/database.js";

export const deviceService = {

  // Create a new Device
  async createDevice(userId, deviceData) {
    return await prisma.device.create({
      data: {
        ...deviceData,
        userId,
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

    return prisma.device.update({
      where: { id },
      data,
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
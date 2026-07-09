import prisma from "../../config/database.js";

const MOCK_USER_ID = "11111111-1111-1111-1111-111111111111";

export const deviceService = {

  // Create a new Device
  async createDevice(deviceData) {
    return await prisma.device.create({
      data: {
        ...deviceData,
        userId: MOCK_USER_ID,
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
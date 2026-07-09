import { api } from './api.js';

const MOCK_USER_ID = "11111111-1111-1111-1111-111111111111";

export const deviceService = {
  // Get all devices
  getDevices: async () => {
    const response = await api.get('/devices');
    return response.data;
  },

  // Get a single device by ID
  getDeviceById: async (id) => {
    const response = await api.get(`/devices/${id}`);
    return response.data;
  },

  // Create a device
  createDevice: async (deviceData) => {
    const payload = { ...deviceData, userId: MOCK_USER_ID };
    const response = await api.post('/devices', payload);
    return response.data;
  },

  // Update a device
  updateDevice: async (id, deviceData) => {
    const response = await api.put(`/devices/${id}`, deviceData);
    return response.data;
  },

  // Delete a device
  deleteDevice: async (id) => {
    const response = await api.delete(`/devices/${id}`);
    return response.data;
  },

  // Trigger manual check
  triggerManualCheck: async (id) => {
    const response = await api.post(`/health/check/${id}`);
    return response.data;
  }
};
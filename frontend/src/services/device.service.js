import { api } from './api.js';

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
    const response = await api.post('/devices', deviceData);
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
  },

  triggerSSLCheck: async (id) => {
    const response = await api.post(`/ssl/check/${id}`);
    return response.data;
  },

  triggerPortsCheck: async (id) => {
    const response = await api.post(`/ports/check/${id}`);
    return response.data;
  }
};
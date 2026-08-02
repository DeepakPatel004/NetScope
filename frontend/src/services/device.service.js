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
  },

  explainHealth: async (id, prompt = '') => {
    const response = await api.post(`/ai/explain/health/${id}`, { prompt });
    return response.data;
  },

  explainSsl: async (id, prompt = '') => {
    const response = await api.post(`/ai/explain/ssl/${id}`, { prompt });
    return response.data;
  },

  explainPorts: async (id, prompt = '') => {
    const response = await api.post(`/ai/explain/ports/${id}`, { prompt });
    return response.data;
  },

  analyzeDevice: async (id, prompt = '') => {
    const response = await api.post(`/ai/analyze/device/${id}`, { prompt });
    return response.data;
  }
};
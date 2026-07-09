import { api } from './api.js';

export const dashboardService = {
  getSummary: async () => {
    const response = await api.get('/dashboard/summary');
    return response.data;
  },

  getDevicesStatus: async () => {
    const response = await api.get('/dashboard/devices');
    return response.data;
  }
};
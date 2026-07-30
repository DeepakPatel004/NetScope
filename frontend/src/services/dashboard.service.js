import { api } from './api.js';

export const dashboardService = {
  getSummary: async () => {
    const response = await api.get('/dashboard/summary');
    return response.data;
  },

  getDevicesStatus: async () => {
    const response = await api.get('/dashboard/devices');
    return response.data;
  },

  getDeviceDetails: async (id) => {
    const response = await api.get(`/dashboard/device/${id}`);
    return response.data;
  },

  downloadReportCsv: async () => {
    const response = await api.get('/reports/csv', { responseType: 'blob' });
    return response.data;
  },

  downloadReportPdf: async () => {
    const response = await api.get('/reports/pdf', { responseType: 'blob' });
    return response.data;
  }
};
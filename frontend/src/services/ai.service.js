import { api } from './api.js';

export const aiService = {
  async getAnomalies(deviceId = null) {
    const url = deviceId ? `/ai/anomalies?deviceId=${deviceId}` : '/ai/anomalies';
    const response = await api.get(url);
    return response.data;
  },

  async getIncidents() {
    const response = await api.get('/ai/incidents');
    return response.data;
  },

  async analyzeDeviceIncident(deviceId) {
    const response = await api.post(`/ai/incidents/${deviceId}/analyze`);
    return response.data;
  },

  async getTimelineSummary(deviceId) {
    const response = await api.get(`/ai/timeline/${deviceId}`);
    return response.data;
  },

  async explainHealth(deviceId, prompt = '') {
    const response = await api.post(`/ai/explain/health/${deviceId}`, { prompt });
    return response.data;
  },

  async explainSsl(deviceId, prompt = '') {
    const response = await api.post(`/ai/explain/ssl/${deviceId}`, { prompt });
    return response.data;
  },

  async explainPorts(deviceId, prompt = '') {
    const response = await api.post(`/ai/explain/ports/${deviceId}`, { prompt });
    return response.data;
  },

  async analyzeDevice(deviceId, prompt = '') {
    const response = await api.post(`/ai/analyze/device/${deviceId}`, { prompt });
    return response.data;
  },
};

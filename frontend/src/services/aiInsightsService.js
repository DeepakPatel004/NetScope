import { api } from './api.js';

/**
 * Service abstraction for AI Insights & Observability Telemetry.
 * Connects directly to backend AI REST endpoints (/api/v3/ai/*).
 */
export const aiInsightsService = {
  async getLatestAnomaly() {
    try {
      const response = await api.get('/ai/anomalies?limit=1');
      const list = response?.data?.data || response?.data || [];
      if (Array.isArray(list) && list.length > 0) {
        return list[0];
      }
    } catch (e) {
      console.warn('[aiInsightsService] Live anomaly check from backend:', e?.message || e);
    }
    return null;
  },

  async getAnomalies(limit = 10) {
    try {
      const response = await api.get(`/ai/anomalies?limit=${limit}`);
      return response?.data?.data || response?.data || [];
    } catch (e) {
      console.warn('[aiInsightsService] Anomaly fetch error:', e?.message || e);
      return [];
    }
  },

  async getActiveIncidents() {
    try {
      const response = await api.get('/ai/incidents');
      return response?.data?.data || response?.data || [];
    } catch (e) {
      console.warn('[aiInsightsService] Incidents fetch error:', e?.message || e);
      return [];
    }
  },

  async getTimelineSummary(deviceId) {
    try {
      const response = await api.get(`/ai/timeline/${deviceId}`);
      return response?.data?.data || response?.data || null;
    } catch (e) {
      console.warn('[aiInsightsService] Timeline summary error:', e?.message || e);
      return null;
    }
  }
};

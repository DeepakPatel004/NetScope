import { api } from './api.js';

// Hardcoding the mock user ID to match your backend testing setup
const MOCK_USER_ID = "11111111-1111-1111-1111-111111111111";

export const deviceService = {
  createDevice: async (deviceData) => {
    // We attach the userId here so the backend accepts it
    const payload = { ...deviceData, userId: MOCK_USER_ID };
    const response = await api.post('/devices', payload);
    return response.data;
  }
};
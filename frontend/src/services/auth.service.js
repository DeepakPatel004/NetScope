import { api } from './api';

const saveTokens = ({ accessToken, refreshToken }) => {
  if (accessToken) localStorage.setItem('accessToken', accessToken);
  if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
};

const clearTokens = () => {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
};

const normalizeError = (err) => {
  if (!err) return 'An unexpected error occurred.';
  if (typeof err === 'string') return err;
  if (err.response?.data?.message) return err.response.data.message;
  if (err.response?.data?.error) return err.response.data.error;
  if (Array.isArray(err.response?.data?.errors)) {
    return err.response.data.errors.map((item) => item.message || item).join(', ');
  }
  if (err.message) return err.message;
  return 'An unexpected error occurred.';
};

export const authService = {
  register: async ({ username, email, password, fullName }) => {
    try {
      const resp = await api.post('/auth/register', { username, email, password, fullName });
      return resp.data;
    } catch (err) {
      const message = normalizeError(err);
      throw new Error(message);
    }
  },

  login: async ({ email, password }) => {
    try {
      const resp = await api.post('/auth/login', { email, password });
      const data = resp.data.data || resp.data;
      saveTokens({ accessToken: data.accessToken, refreshToken: data.refreshToken });
      const userData = data.user || { id: data.id, username: data.username, email: data.email, fullName: data.fullName, role: data.role };
      if (userData) {
        localStorage.setItem('user', JSON.stringify(userData));
      }
      return data;
    } catch (err) {
      const message = normalizeError(err);
      throw new Error(message);
    }
  },

  logout: async () => {
    const refreshToken = localStorage.getItem('refreshToken');
    try {
      if (refreshToken) {
        await api.post('/auth/logout', { refreshToken });
      }
    } catch (_err) {
      // ignore logout failures
    }
    clearTokens();
  },

  refresh: async () => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) throw new Error('No refresh token available. Please sign in again.');
      const resp = await api.post('/auth/refresh', { refreshToken });
      const data = resp.data.data || resp.data;
      saveTokens({ accessToken: data.accessToken, refreshToken: data.refreshToken });
      return data;
    } catch (err) {
      const message = normalizeError(err);
      throw new Error(message);
    }
  },

  getProfile: async () => {
    try {
      const resp = await api.get('/auth/profile');
      return resp.data.data || resp.data;
    } catch (err) {
      const message = normalizeError(err);
      throw new Error(message);
    }
  },

  changePassword: async ({ oldPassword, newPassword }) => {
    try {
      const resp = await api.post('/auth/change-password', { oldPassword, newPassword });
      return resp.data;
    } catch (err) {
      const message = normalizeError(err);
      throw new Error(message);
    }
  },

  isAuthenticated: () => !!localStorage.getItem('accessToken'),
};

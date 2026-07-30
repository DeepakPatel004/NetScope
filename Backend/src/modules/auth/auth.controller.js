import { authService } from './auth.service.js';

export const authController = {
  async register(req, res, next) {
    try {
      const { username, email, password, fullName } = req.body;
      const user = await authService.register({ username, email, password, fullName });
      return res.status(201).json({ success: true, data: { id: user.id, username: user.username, email: user.email } });
    } catch (error) {
      next(error);
    }
  },

  async login(req, res, next) {
    try {
      const { email, password } = req.body;
      const result = await authService.login({ email, password });
      return res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },

  async logout(req, res, next) {
    try {
      const { refreshToken } = req.body;
      await authService.logout(refreshToken);
      return res.status(200).json({ success: true, message: 'Logged out' });
    } catch (error) {
      next(error);
    }
  },

  async refreshToken(req, res, next) {
    try {
      const { refreshToken } = req.body;
      const data = await authService.refreshToken(refreshToken);
      return res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  },

  async profile(req, res, next) {
    try {
      const userId = req.user?.id;
      if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });
      const profile = await authService.getProfile(userId);
      return res.status(200).json({ success: true, data: profile });
    } catch (error) {
      next(error);
    }
  },

  async changePassword(req, res, next) {
    try {
      const userId = req.user?.id;
      if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });
      const { oldPassword, newPassword } = req.body;
      await authService.changePassword(userId, oldPassword, newPassword);
      return res.status(200).json({ success: true, message: 'Password changed' });
    } catch (error) {
      next(error);
    }
  }
};

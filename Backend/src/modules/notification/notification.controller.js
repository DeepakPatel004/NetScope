import { notificationService } from './notification.service.js';

export const notificationController = {
  async getNotifications(req, res, next) {
    try {
      const userId = req.user.id;
      const notifications = await notificationService.getUserNotifications(userId);
      res.json({ success: true, data: notifications });
    } catch (error) {
      next(error);
    }
  },

  async getPreferences(req, res, next) {
    try {
      const userId = req.user.id;
      const prefs = await notificationService.getUserPreferences(userId);
      res.json({ success: true, data: prefs });
    } catch (error) {
      next(error);
    }
  },

  async updatePreferences(req, res, next) {
    try {
      const userId = req.user.id;
      const updated = await notificationService.updateUserPreferences(userId, req.body);
      res.json({ success: true, data: updated });
    } catch (error) {
      next(error);
    }
  },

  async markAsRead(req, res, next) {
    try {
      const userId = req.user.id;
      const { id } = req.params;
      await notificationService.markAsRead(userId, id);
      res.json({ success: true, message: 'Notification marked as read' });
    } catch (error) {
      next(error);
    }
  },

  async markAllAsRead(req, res, next) {
    try {
      const userId = req.user.id;
      await notificationService.markAllAsRead(userId);
      res.json({ success: true, message: 'All notifications marked as read' });
    } catch (error) {
      next(error);
    }
  },

  async sendTestEmail(req, res, next) {
    try {
      const userId = req.user.id;
      const { email } = req.body || {};
      const result = await notificationService.sendTestEmail(userId, email);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },
};

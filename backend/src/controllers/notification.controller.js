const { notificationService } = require("../services/notification.service");
const { sendSuccess, sendError, sendPaginated } = require("../utils/response");

class NotificationController {
  /**
   * GET /api/notifications
   */
  async getNotifications(req, res, next) {
    try {
      const { page = 1, limit = 20 } = req.query;
      const result = await notificationService.getUserNotifications(
        req.user.id,
        page,
        limit,
      );
      sendPaginated(
        res,
        result.notifications,
        result.page,
        result.limit,
        result.total,
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/notifications/unread-count
   */
  async getUnreadCount(req, res, next) {
    try {
      const count = await notificationService.getUnreadCount(req.user.id);
      sendSuccess(res, { count });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/notifications/:id/read
   */
  async markAsRead(req, res, next) {
    try {
      const result = await notificationService.markAsRead(
        req.params.id,
        req.user.id,
      );
      sendSuccess(res, result);
    } catch (error) {
      if (error.statusCode)
        return sendError(res, error.message, error.statusCode);
      next(error);
    }
  }

  /**
   * PUT /api/notifications/read-all
   */
  async markAllAsRead(req, res, next) {
    try {
      const result = await notificationService.markAllAsRead(req.user.id);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/notifications/:id
   */
  async deleteNotification(req, res, next) {
    try {
      const result = await notificationService.deleteNotification(
        req.params.id,
        req.user.id,
      );
      sendSuccess(res, result);
    } catch (error) {
      if (error.statusCode)
        return sendError(res, error.message, error.statusCode);
      next(error);
    }
  }
}

module.exports = new NotificationController();

const { pool } = require("../config/db");

const normalizeNotificationForClient = (notification, role = "USER") => {
  const content = notification?.content || notification?.message || "";
  const type = (notification?.type || "SYSTEM").toUpperCase();
  const titleByType = {
    RENTAL_REQUEST: "Thông báo yêu cầu thuê",
    CONTRACT: "Thông báo hợp đồng",
    PAYMENT: "Thông báo thanh toán",
    ROOMMATE_REQUEST: "Thông báo kết nối roommate",
    SYSTEM: "Thông báo hệ thống",
  };

  return {
    id: notification?.id,
    user_id: notification?.user_id,
    type,
    title: notification?.title || titleByType[type] || "Thông báo",
    message: notification?.message || content,
    content,
    reference_id: notification?.reference_id || null,
    reference_type: notification?.reference_type || null,
    is_read: Boolean(notification?.is_read),
    created_at: notification?.created_at,
    role,
  };
};

class NotificationService {
  /**
   * Create a new notification
   * Uses Polymorphic Reference pattern: reference_id + reference_type
   */
  async create({
    user_id,
    type = "SYSTEM",
    content,
    reference_id = null,
    reference_type = null,
  }) {
    const [result] = await pool.query(
      `INSERT INTO Notifications (user_id, type, content, reference_id, reference_type)
       VALUES (?, ?, ?, ?, ?)`,
      [user_id, type, content, reference_id, reference_type],
    );
    return normalizeNotificationForClient(
      { id: result.insertId, user_id, type, content },
      "USER",
    );
  }

  /**
   * Get paginated notifications for a user
   */
  async getUserNotifications(userId, page = 1, limit = 20) {
    const offset = (page - 1) * limit;

    const [countResult] = await pool.query(
      "SELECT COUNT(*) as total FROM Notifications WHERE user_id = ?",
      [userId],
    );

    const [notifications] = await pool.query(
      "SELECT * FROM Notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?",
      [userId, parseInt(limit), parseInt(offset)],
    );

    const normalized = notifications.map((n) =>
      normalizeNotificationForClient(n),
    );

    return {
      notifications: normalized,
      total: countResult[0].total,
      page: parseInt(page),
      limit: parseInt(limit),
    };
  }

  /**
   * Get count of unread notifications
   * Uses composite index: idx_notification_user_read (user_id, is_read)
   */
  async getUnreadCount(userId) {
    const [result] = await pool.query(
      "SELECT COUNT(*) as count FROM Notifications WHERE user_id = ? AND is_read = FALSE",
      [userId],
    );
    return result[0].count;
  }

  /**
   * Mark a notification as read
   */
  async markAsRead(notificationId, userId) {
    const [result] = await pool.query(
      "UPDATE Notifications SET is_read = TRUE WHERE id = ? AND user_id = ?",
      [notificationId, userId],
    );

    if (result.affectedRows === 0) {
      throw { statusCode: 404, message: "Không tìm thấy thông báo" };
    }

    return { message: "Đã đánh dấu đã đọc" };
  }

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId) {
    await pool.query(
      "UPDATE Notifications SET is_read = TRUE WHERE user_id = ? AND is_read = FALSE",
      [userId],
    );
    return { message: "Đã đánh dấu tất cả đã đọc" };
  }

  /**
   * Delete a notification
   */
  async deleteNotification(notificationId, userId) {
    const [result] = await pool.query(
      "DELETE FROM Notifications WHERE id = ? AND user_id = ?",
      [notificationId, userId],
    );

    if (result.affectedRows === 0) {
      throw { statusCode: 404, message: "Không tìm thấy thông báo" };
    }

    return { message: "Đã xóa thông báo" };
  }
}

module.exports = {
  notificationService: new NotificationService(),
  normalizeNotificationForClient,
};

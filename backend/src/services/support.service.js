const { pool } = require("../config/db");
const { notificationService } = require("./notification.service");

class SupportService {
  async appendMessageToThread(requestId, senderId, senderRole, message) {
    if (!message || !message.trim()) return;

    const trimmed = message.trim();

    try {
      await pool.query(
        `INSERT INTO SupportMessages (support_request_id, sender_id, sender_role, message)
         VALUES (?, ?, ?, ?)`,
        [requestId, senderId, senderRole, trimmed],
      );
    } catch (error) {
      const isMissingTable =
        error.code === "ER_NO_SUCH_TABLE" ||
        /doesn't exist/i.test(error.message);
      if (!isMissingTable) throw error;

      await pool.query(`
        CREATE TABLE IF NOT EXISTS SupportMessages (
          id INT PRIMARY KEY AUTO_INCREMENT,
          support_request_id INT NOT NULL,
          sender_id INT NOT NULL,
          sender_role ENUM('USER', 'OWNER', 'ADMIN') DEFAULT 'USER',
          message TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          FOREIGN KEY (support_request_id) REFERENCES SupportRequests(id) ON DELETE CASCADE,
          FOREIGN KEY (sender_id) REFERENCES Users(id) ON DELETE CASCADE,
          INDEX idx_support_message_request (support_request_id),
          INDEX idx_support_message_created (created_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);

      await pool.query(
        `INSERT INTO SupportMessages (support_request_id, sender_id, sender_role, message)
         VALUES (?, ?, ?, ?)`,
        [requestId, senderId, senderRole, trimmed],
      );
    }
  }

  async getThreadMessages(requestId, request) {
    try {
      const [messages] = await pool.query(
        `SELECT sm.*, u.name as sender_name
         FROM SupportMessages sm
         JOIN Users u ON sm.sender_id = u.id
         WHERE sm.support_request_id = ?
         ORDER BY sm.created_at ASC`,
        [requestId],
      );
      return messages;
    } catch (error) {
      const isMissingTable =
        error.code === "ER_NO_SUCH_TABLE" ||
        /doesn't exist/i.test(error.message);
      if (!isMissingTable) throw error;

      const fallbackMessages = [];
      if (request?.message) {
        fallbackMessages.push({
          id: null,
          support_request_id: requestId,
          sender_id: request.user_id,
          sender_role: "USER",
          sender_name: request.user_name || "Bạn",
          message: request.message,
          created_at: request.created_at,
        });
      }
      if (request?.response) {
        fallbackMessages.push({
          id: null,
          support_request_id: requestId,
          sender_id: request.resolved_by,
          sender_role: "ADMIN",
          sender_name: request.resolved_by_name || "Admin",
          message: request.response,
          created_at: request.resolved_at || request.updated_at,
        });
      }
      return fallbackMessages;
    }
  }

  /**
   * Create a support request (UC 2.8 / 3.7 — User/Owner)
   * Uses single SupportRequests table (3NF design)
   */
  async createRequest(userId, data) {
    const { subject, message } = data;

    const [result] = await pool.query(
      `INSERT INTO SupportRequests (user_id, subject, message, status)
       VALUES (?, ?, ?, 'OPEN')`,
      [userId, subject || null, message],
    );

    await this.appendMessageToThread(result.insertId, userId, "USER", message);

    // Notify user of ticket creation
    try {
      await notificationService.create({
        user_id: userId,
        type: "SUPPORT",
        content: `Yêu cầu hỗ trợ #${result.insertId} đã được ghi nhận. Chúng tôi sẽ phản hồi sớm nhất.`,
        reference_id: result.insertId,
        reference_type: "SUPPORT",
      });
    } catch (e) {}

    // Notify admins
    try {
      const [admins] = await pool.query(
        "SELECT id FROM Users WHERE role = 'ADMIN'",
      );
      for (const admin of admins) {
        await notificationService.create({
          user_id: admin.id,
          type: "SUPPORT",
          content: `Có yêu cầu hỗ trợ mới #${result.insertId} cần được xử lý.`,
          reference_id: result.insertId,
          reference_type: "SUPPORT",
        });
      }
    } catch (e) {}

    return this.getRequestById(result.insertId, userId);
  }

  /**
   * Get support request by ID
   */
  async getRequestById(requestId, userId = null, isAdmin = false) {
    let query = `
      SELECT sr.*, u.name as user_name, u.email as user_email,
             a.name as resolved_by_name
      FROM SupportRequests sr
      JOIN Users u ON sr.user_id = u.id
      LEFT JOIN Users a ON sr.resolved_by = a.id
      WHERE sr.id = ?
    `;
    const params = [requestId];

    if (!isAdmin && userId) {
      query += " AND sr.user_id = ?";
      params.push(userId);
    }

    const [requests] = await pool.query(query, params);

    if (requests.length === 0) {
      throw { statusCode: 404, message: "Không tìm thấy yêu cầu hỗ trợ" };
    }

    const request = requests[0];
    const messages = await this.getThreadMessages(requestId, request);
    return { ...request, messages };
  }

  /**
   * Get user's support requests (UC 2.8)
   */
  async getUserRequests(userId, page = 1, limit = 10) {
    const offset = (page - 1) * limit;

    const [countResult] = await pool.query(
      "SELECT COUNT(*) as total FROM SupportRequests WHERE user_id = ?",
      [userId],
    );

    const [requests] = await pool.query(
      `SELECT sr.*, a.name as resolved_by_name
       FROM SupportRequests sr
       LEFT JOIN Users a ON sr.resolved_by = a.id
       WHERE sr.user_id = ?
       ORDER BY sr.created_at DESC LIMIT ? OFFSET ?`,
      [userId, parseInt(limit), parseInt(offset)],
    );

    return {
      requests,
      total: countResult[0].total,
      page: parseInt(page),
      limit: parseInt(limit),
    };
  }

  /**
   * Get all support requests (Admin — UC 4.4)
   */
  async getAllRequests(page = 1, limit = 10, status = null) {
    const offset = (page - 1) * limit;
    let whereClause = "";
    const params = [];

    if (status) {
      whereClause = "WHERE sr.status = ?";
      params.push(status);
    }

    const [countResult] = await pool.query(
      `SELECT COUNT(*) as total FROM SupportRequests sr ${whereClause}`,
      params,
    );

    const [requests] = await pool.query(
      `SELECT sr.*, u.name as user_name, u.email as user_email,
              a.name as resolved_by_name
       FROM SupportRequests sr
       JOIN Users u ON sr.user_id = u.id
       LEFT JOIN Users a ON sr.resolved_by = a.id
       ${whereClause}
       ORDER BY sr.created_at DESC LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), parseInt(offset)],
    );

    return {
      requests,
      total: countResult[0].total,
      page: parseInt(page),
      limit: parseInt(limit),
    };
  }

  async createMessage(requestId, senderId, senderRole, message) {
    const trimmed = message?.trim();
    if (!trimmed) {
      throw {
        statusCode: 400,
        message: "Nội dung tin nhắn không được để trống",
      };
    }

    const [requests] = await pool.query(
      "SELECT user_id FROM SupportRequests WHERE id = ?",
      [requestId],
    );

    if (requests.length === 0) {
      throw { statusCode: 404, message: "Không tìm thấy yêu cầu hỗ trợ" };
    }

    if (senderRole !== "ADMIN" && requests[0].user_id !== senderId) {
      throw {
        statusCode: 403,
        message: "Bạn không có quyền gửi tin nhắn cho yêu cầu này",
      };
    }

    await this.appendMessageToThread(requestId, senderId, senderRole, trimmed);

    // Send notifications
    try {
      if (senderRole === "ADMIN") {
        // Notify the user
        await notificationService.create({
          user_id: requests[0].user_id,
          type: "SUPPORT",
          content: `Admin đã phản hồi trong yêu cầu hỗ trợ #${requestId} của bạn.`,
          reference_id: requestId,
          reference_type: "SUPPORT",
        });
      } else {
        // Notify all admins
        const [admins] = await pool.query(
          "SELECT id FROM Users WHERE role = 'ADMIN'",
        );
        for (const admin of admins) {
          await notificationService.create({
            user_id: admin.id,
            type: "SUPPORT",
            content: `Khách hàng vừa phản hồi trong yêu cầu hỗ trợ #${requestId}.`,
            reference_id: requestId,
            reference_type: "SUPPORT",
          });
        }
      }
    } catch (e) {}

    return this.getRequestById(requestId, senderId, senderRole === "ADMIN");
  }

  /**
   * Respond to support request (Admin — UC 4.4)
   * Admin writes response, sets resolved_by, resolved_at, status
   */
  async respondToRequest(requestId, adminId, response) {
    if (!response || !response.trim()) {
      throw {
        statusCode: 400,
        message: "Nội dung phản hồi không được để trống",
      };
    }

    const [requests] = await pool.query(
      "SELECT user_id, subject FROM SupportRequests WHERE id = ?",
      [requestId],
    );

    if (requests.length === 0) {
      throw { statusCode: 404, message: "Không tìm thấy yêu cầu hỗ trợ" };
    }

    await pool.query(
      `UPDATE SupportRequests
       SET response = ?, resolved_by = ?, resolved_at = NOW(), status = 'RESOLVED'
       WHERE id = ?`,
      [response.trim(), adminId, requestId],
    );

    await this.appendMessageToThread(
      requestId,
      adminId,
      "ADMIN",
      response.trim(),
    );

    // Notify user
    try {
      await notificationService.create({
        user_id: requests[0].user_id,
        type: "SUPPORT",
        content: `Yêu cầu hỗ trợ "${requests[0].subject || "#" + requestId}" đã được Admin phản hồi.`,
        reference_id: requestId,
        reference_type: "SUPPORT",
      });
    } catch (e) {
      /* silent */
    }

    return this.getRequestById(requestId, null, true);
  }

  /**
   * Update support request status (Admin)
   */
  async updateStatus(requestId, status) {
    const validStatuses = ["OPEN", "IN_PROGRESS", "RESOLVED"];
    if (!validStatuses.includes(status)) {
      throw { statusCode: 400, message: "Trạng thái không hợp lệ" };
    }

    const [requests] = await pool.query(
      "SELECT user_id, subject FROM SupportRequests WHERE id = ?",
      [requestId],
    );

    if (requests.length === 0) {
      throw { statusCode: 404, message: "Không tìm thấy yêu cầu hỗ trợ" };
    }

    const updates = ["status = ?"];
    const values = [status];

    if (status === "RESOLVED") {
      updates.push("resolved_at = NOW()");
    }

    values.push(requestId);
    await pool.query(
      `UPDATE SupportRequests SET ${updates.join(", ")} WHERE id = ?`,
      values,
    );

    // Notify user
    try {
      const statusVi = {
        OPEN: "mở lại",
        IN_PROGRESS: "đang xử lý",
        RESOLVED: "đã giải quyết",
      };
      await notificationService.create({
        user_id: requests[0].user_id,
        type: "SYSTEM",
        content: `Yêu cầu hỗ trợ "${requests[0].subject || "#" + requestId}" đã chuyển sang: ${statusVi[status]}.`,
        reference_id: requestId,
        reference_type: "SUPPORT",
      });
    } catch (e) {
      /* silent */
    }

    return this.getRequestById(requestId, null, true);
  }
}

module.exports = new SupportService();

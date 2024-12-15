const { pool } = require("../config/db");
const { notificationService } = require("./notification.service");

class RentalService {
  /**
   * Create a rental request (UC-05 — User)
   */
  async createRequest(userId, data) {
    const { room_id, note } = data;

    // Check room exists and is AVAILABLE
    const [rooms] = await pool.query(
      "SELECT r.*, u.name as owner_name FROM Rooms r JOIN Users u ON r.owner_id = u.id WHERE r.id = ? AND r.status = 'AVAILABLE'",
      [room_id],
    );
    if (rooms.length === 0) {
      throw {
        statusCode: 404,
        message: "Phòng không tồn tại hoặc không còn trống",
      };
    }

    const room = rooms[0];

    // Check user is not the owner
    if (room.owner_id === userId) {
      throw {
        statusCode: 400,
        message: "Bạn không thể thuê phòng của chính mình",
      };
    }

    // Check for existing pending request
    const [existing] = await pool.query(
      "SELECT id FROM RentalRequests WHERE room_id = ? AND user_id = ? AND status = 'PENDING'",
      [room_id, userId],
    );
    if (existing.length > 0) {
      throw {
        statusCode: 400,
        message: "Bạn đang có yêu cầu chờ duyệt cho phòng này",
      };
    }

    // Check if they already have an active or pending contract for this room
    const [existingContract] = await pool.query(
      "SELECT id FROM Contracts WHERE room_id = ? AND user_id = ? AND status IN ('PENDING', 'ACTIVE')",
      [room_id, userId],
    );
    if (existingContract.length > 0) {
      throw {
        statusCode: 400,
        message: "Bạn đang có hợp đồng hoặc chờ ký hợp đồng cho phòng này",
      };
    }

    const [result] = await pool.query(
      `INSERT INTO RentalRequests (user_id, room_id, note, status)
       VALUES (?, ?, ?, 'PENDING')`,
      [userId, room_id, note || null],
    );

    // Notify owner (UC-05 step 5)
    try {
      await notificationService.create({
        user_id: room.owner_id,
        type: "RENTAL_REQUEST",
        content: `Có yêu cầu thuê phòng mới cho "${room.title}"`,
        reference_id: result.insertId,
        reference_type: "RENTAL_REQUEST",
      });
    } catch (e) {
      /* notification failure should not break flow */
    }

    return this.getRequestById(result.insertId);
  }

  /**
   * Get rental request by ID
   */
  async getRequestById(id) {
    const [requests] = await pool.query(
      `SELECT rr.*,
              r.title as room_title, r.price as room_price, r.city as room_city, r.district as room_district,
              (SELECT image_url FROM RoomImages WHERE room_id = r.id AND image_order = 0 LIMIT 1) as room_image,
              u.name as user_name, u.email as user_email, u.phone as user_phone,
              o.name as owner_name
       FROM RentalRequests rr
       JOIN Rooms r ON rr.room_id = r.id
       JOIN Users u ON rr.user_id = u.id
       JOIN Users o ON r.owner_id = o.id
       WHERE rr.id = ?`,
      [id],
    );
    if (requests.length === 0) {
      throw { statusCode: 404, message: "Không tìm thấy yêu cầu thuê" };
    }
    return requests[0];
  }

  /**
   * Get user's rental requests (UC-05A)
   */
  async getUserRequests(userId, page = 1, limit = 10) {
    const offset = (page - 1) * limit;
    const [countResult] = await pool.query(
      "SELECT COUNT(*) as total FROM RentalRequests WHERE user_id = ?",
      [userId],
    );

    const [requests] = await pool.query(
      `SELECT rr.*,
              r.title as room_title, r.price as room_price, r.city as room_city,
              (SELECT image_url FROM RoomImages WHERE room_id = r.id AND image_order = 0 LIMIT 1) as room_image,
              o.name as owner_name
       FROM RentalRequests rr
       JOIN Rooms r ON rr.room_id = r.id
       JOIN Users o ON r.owner_id = o.id
       WHERE rr.user_id = ?
       ORDER BY rr.created_at DESC
       LIMIT ? OFFSET ?`,
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
   * Get owner's rental requests (UC-06)
   */
  async getOwnerRequests(ownerId, status, page = 1, limit = 10) {
    const offset = (page - 1) * limit;

    // Owner's rooms → their rental requests
    let whereClause = "WHERE r.owner_id = ?";
    const params = [ownerId];

    if (status) {
      whereClause += " AND rr.status = ?";
      params.push(status);
    }

    const [countResult] = await pool.query(
      `SELECT COUNT(*) as total FROM RentalRequests rr
       JOIN Rooms r ON rr.room_id = r.id
       ${whereClause}`,
      params,
    );

    const [requests] = await pool.query(
      `SELECT rr.*,
              r.title as room_title, r.price as room_price,
              (SELECT image_url FROM RoomImages WHERE room_id = r.id AND image_order = 0 LIMIT 1) as room_image,
              u.name as user_name, u.email as user_email, u.phone as user_phone
       FROM RentalRequests rr
       JOIN Rooms r ON rr.room_id = r.id
       JOIN Users u ON rr.user_id = u.id
       ${whereClause}
       ORDER BY rr.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), parseInt(offset)],
    );

    return {
      requests,
      total: countResult[0].total,
      page: parseInt(page),
      limit: parseInt(limit),
    };
  }

  /**
   * Approve rental request (UC-06 — Owner)
   */
  async approveRequest(requestId, ownerId) {
    const [requests] = await pool.query(
      `SELECT rr.* FROM RentalRequests rr
       JOIN Rooms r ON rr.room_id = r.id
       WHERE rr.id = ? AND r.owner_id = ? AND rr.status = 'PENDING'`,
      [requestId, ownerId],
    );

    if (requests.length === 0) {
      throw {
        statusCode: 404,
        message: "Yêu cầu không tồn tại hoặc đã được xử lý",
      };
    }

    await pool.query(
      "UPDATE RentalRequests SET status = 'APPROVED' WHERE id = ?",
      [requestId],
    );

    // Notify user
    try {
      await notificationService.create({
        user_id: requests[0].user_id,
        type: "RENTAL_REQUEST",
        content: "Yêu cầu thuê phòng của bạn đã được chấp nhận",
        reference_id: requestId,
        reference_type: "RENTAL_REQUEST",
      });
    } catch (e) {
      /* silent */
    }

    return this.getRequestById(requestId);
  }

  /**
   * Reject rental request (UC-06 — Owner)
   */
  async rejectRequest(requestId, ownerId, reject_reason) {
    const [requests] = await pool.query(
      `SELECT rr.* FROM RentalRequests rr
       JOIN Rooms r ON rr.room_id = r.id
       WHERE rr.id = ? AND r.owner_id = ? AND rr.status = 'PENDING'`,
      [requestId, ownerId],
    );

    if (requests.length === 0) {
      throw {
        statusCode: 404,
        message: "Yêu cầu không tồn tại hoặc đã được xử lý",
      };
    }

    await pool.query(
      "UPDATE RentalRequests SET status = 'REJECTED', reject_reason = ? WHERE id = ?",
      [reject_reason || null, requestId],
    );

    // Notify user
    try {
      await notificationService.create({
        user_id: requests[0].user_id,
        type: "RENTAL_REQUEST",
        content: `Yêu cầu thuê phòng của bạn đã bị từ chối${reject_reason ? ": " + reject_reason : ""}`,
        reference_id: requestId,
        reference_type: "RENTAL_REQUEST",
      });
    } catch (e) {
      /* silent */
    }

    return this.getRequestById(requestId);
  }

  /**
   * Cancel rental request (User)
   */
  async cancelRequest(requestId, userId) {
    const [requests] = await pool.query(
      "SELECT * FROM RentalRequests WHERE id = ? AND user_id = ? AND status = 'PENDING'",
      [requestId, userId],
    );

    if (requests.length === 0) {
      throw {
        statusCode: 404,
        message: "Yêu cầu không tồn tại hoặc đã được xử lý",
      };
    }

    await pool.query("DELETE FROM RentalRequests WHERE id = ?", [requestId]);

    return { success: true, message: "Đã hủy yêu cầu thuê phòng" };
  }
}

module.exports = new RentalService();

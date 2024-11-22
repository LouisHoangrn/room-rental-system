const { pool } = require("../config/db");
const { notificationService } = require("./notification.service");
const supportService = require("./support.service");

class AdminService {
  /**
   * Get overall dashboard statistics (UC 4.5)
   */
  async getDashboardStats() {
    const stats = {};

    const [[users]] = await pool.query(
      "SELECT COUNT(*) as count FROM Users WHERE role = 'USER'",
    );
    const [[owners]] = await pool.query(
      "SELECT COUNT(*) as count FROM Users WHERE role = 'OWNER'",
    );
    const [[rooms]] = await pool.query("SELECT COUNT(*) as count FROM Rooms");
    const [[pendingRooms]] = await pool.query(
      "SELECT COUNT(*) as count FROM Rooms WHERE status = 'PENDING'",
    );
    const [[activeContracts]] = await pool.query(
      "SELECT COUNT(*) as count FROM Contracts WHERE status = 'ACTIVE'",
    );
    const [[totalContracts]] = await pool.query(
      "SELECT COUNT(*) as count FROM Contracts",
    );
    const [[openSupport]] = await pool.query(
      "SELECT COUNT(*) as count FROM SupportRequests WHERE status IN ('OPEN', 'IN_PROGRESS')",
    );

    // Payment stats
    const [[revenue]] = await pool.query(
      "SELECT COALESCE(SUM(amount), 0) as total FROM Payments WHERE status = 'PAID'",
    );
    const [[paidPayments]] = await pool.query(
      "SELECT COUNT(*) as count FROM Payments WHERE status = 'PAID'",
    );
    const [[pendingPayments]] = await pool.query(
      "SELECT COUNT(*) as count FROM Payments WHERE status = 'PENDING'",
    );

    stats.total_users = users.count;
    stats.total_owners = owners.count;
    stats.total_rooms = rooms.count;
    stats.pending_rooms = pendingRooms.count;
    stats.active_contracts = activeContracts.count;
    stats.total_contracts = totalContracts.count;
    stats.open_support = openSupport.count;
    stats.total_revenue = revenue.total;
    stats.paid_payments = paidPayments.count;
    stats.pending_payments = pendingPayments.count;

    return stats;
  }

  /**
   * Get all users with pagination and filtering (UC 4.2)
   */
  async getAllUsers(
    page = 1,
    limit = 10,
    role = null,
    search = null,
    status = null,
  ) {
    const offset = (page - 1) * limit;
    let whereClause = "WHERE 1=1";
    const params = [];

    if (role) {
      whereClause += " AND role = ?";
      params.push(role);
    }

    if (status) {
      whereClause += " AND status = ?";
      params.push(status);
    }

    if (search) {
      whereClause += " AND (email LIKE ? OR name LIKE ? OR phone LIKE ?)";
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    const [countResult] = await pool.query(
      `SELECT COUNT(*) as total FROM Users ${whereClause}`,
      params,
    );

    const [users] = await pool.query(
      `SELECT id, name, email, phone, role, status, created_at
       FROM Users ${whereClause}
       ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), parseInt(offset)],
    );

    return {
      users,
      total: countResult[0].total,
      page: parseInt(page),
      limit: parseInt(limit),
    };
  }

  /**
   * Get a single user by ID (UC 4.2)
   */
  async getUserById(userId) {
    const [users] = await pool.query(
      "SELECT id, name, email, phone, role, status, created_at, updated_at FROM Users WHERE id = ?",
      [userId],
    );

    if (users.length === 0) {
      throw { statusCode: 404, message: "Không tìm thấy người dùng" };
    }

    return users[0];
  }

  /**
   * Block user account (UC 4.2 — Khóa tài khoản)
   */
  async blockUser(userId) {
    const [users] = await pool.query(
      "SELECT role, status FROM Users WHERE id = ?",
      [userId],
    );

    if (users.length === 0) {
      throw { statusCode: 404, message: "Không tìm thấy người dùng" };
    }

    if (users[0].role === "ADMIN") {
      throw { statusCode: 400, message: "Không thể khóa tài khoản Admin" };
    }

    await pool.query("UPDATE Users SET status = 'BLOCKED' WHERE id = ?", [
      userId,
    ]);

    return {
      id: parseInt(userId),
      status: "BLOCKED",
      message: "Đã khóa tài khoản",
    };
  }

  /**
   * Unblock user account (UC 4.2 — Mở khóa tài khoản)
   */
  async unblockUser(userId) {
    const [users] = await pool.query(
      "SELECT role, status FROM Users WHERE id = ?",
      [userId],
    );

    if (users.length === 0) {
      throw { statusCode: 404, message: "Không tìm thấy người dùng" };
    }

    await pool.query("UPDATE Users SET status = 'ACTIVE' WHERE id = ?", [
      userId,
    ]);

    return {
      id: parseInt(userId),
      status: "ACTIVE",
      message: "Đã mở khóa tài khoản",
    };
  }

  /**
   * Toggle user status (legacy support)
   */
  async toggleUserStatus(userId) {
    const [users] = await pool.query(
      "SELECT role, status FROM Users WHERE id = ?",
      [userId],
    );

    if (users.length === 0) {
      throw { statusCode: 404, message: "Không tìm thấy người dùng" };
    }

    if (users[0].role === "ADMIN") {
      throw { statusCode: 400, message: "Không thể thay đổi trạng thái Admin" };
    }

    const newStatus = users[0].status === "ACTIVE" ? "BLOCKED" : "ACTIVE";
    await pool.query("UPDATE Users SET status = ? WHERE id = ?", [
      newStatus,
      userId,
    ]);

    return {
      id: parseInt(userId),
      status: newStatus,
      message: `Tài khoản đã ${newStatus === "ACTIVE" ? "mở khóa" : "khóa"}`,
    };
  }

  /**
   * Get all rooms for moderation (UC 4.3)
   */
  async getAllRooms(page = 1, limit = 10, status = null) {
    const offset = (page - 1) * limit;
    let whereClause = "";
    const params = [];

    if (status) {
      whereClause = "WHERE r.status = ?";
      params.push(status);
    }

    const [countResult] = await pool.query(
      `SELECT COUNT(*) as total FROM Rooms r ${whereClause}`,
      params,
    );

    const [rooms] = await pool.query(
      `SELECT r.*,
              u.name AS owner_name, u.email AS owner_email,
              (SELECT ri.image_url FROM RoomImages ri WHERE ri.room_id = r.id AND ri.image_order = 0 LIMIT 1) AS primary_image
       FROM Rooms r
       JOIN Users u ON r.owner_id = u.id
       ${whereClause}
       ORDER BY r.created_at DESC LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), parseInt(offset)],
    );

    return {
      rooms,
      total: countResult[0].total,
      page: parseInt(page),
      limit: parseInt(limit),
    };
  }

  /**
   * Approve room (UC 4.3 / UC-14)
   * PENDING → AVAILABLE
   */
  async approveRoom(roomId) {
    const [rooms] = await pool.query(
      "SELECT owner_id, title FROM Rooms WHERE id = ?",
      [roomId],
    );

    if (rooms.length === 0) {
      throw { statusCode: 404, message: "Không tìm thấy phòng" };
    }

    await pool.query("UPDATE Rooms SET status = 'AVAILABLE' WHERE id = ?", [
      roomId,
    ]);

    // Notify owner
    try {
      await notificationService.create({
        user_id: rooms[0].owner_id,
        type: "SYSTEM",
        content: `Phòng "${rooms[0].title}" đã được Admin duyệt và hiển thị công khai.`,
        reference_id: null,
        reference_type: null,
      });
    } catch (e) {
      /* silent */
    }

    return {
      id: parseInt(roomId),
      status: "AVAILABLE",
      message: "Phòng đã được duyệt",
    };
  }

  /**
   * Reject room (UC 4.3 / UC-14)
   * → REJECTED + reject_reason
   */
  async rejectRoom(roomId, reject_reason) {
    const [rooms] = await pool.query(
      "SELECT owner_id, title FROM Rooms WHERE id = ?",
      [roomId],
    );

    if (rooms.length === 0) {
      throw { statusCode: 404, message: "Không tìm thấy phòng" };
    }

    await pool.query(
      "UPDATE Rooms SET status = 'REJECTED', reject_reason = ? WHERE id = ?",
      [reject_reason || null, roomId],
    );

    // Notify owner with reason
    try {
      await notificationService.create({
        user_id: rooms[0].owner_id,
        type: "SYSTEM",
        content: `Phòng "${rooms[0].title}" đã bị từ chối bởi Admin.${reject_reason ? " Lý do: " + reject_reason : ""}`,
        reference_id: null,
        reference_type: null,
      });
    } catch (e) {
      /* silent */
    }

    return {
      id: parseInt(roomId),
      status: "REJECTED",
      message: "Phòng đã bị từ chối",
    };
  }

  // ═══════════════════════════════════════════════
  // SUPPORT (Admin side — UC 4.4)
  // Delegates to SupportService to avoid code duplication (DRY)
  // ═══════════════════════════════════════════════

  /**
   * Get all support requests (delegates to SupportService)
   */
  async getAllSupportRequests(page = 1, limit = 10, status = null) {
    return supportService.getAllRequests(page, limit, status);
  }

  /**
   * Get support request by ID (delegates to SupportService)
   */
  async getSupportRequestById(requestId) {
    return supportService.getRequestById(requestId, null, true);
  }

  /**
   * Respond to support request (delegates to SupportService)
   */
  async respondToSupport(requestId, adminId, response) {
    return supportService.respondToRequest(requestId, adminId, response);
  }

  /**
   * Update support request status (delegates to SupportService)
   */
  async updateSupportStatus(requestId, status) {
    return supportService.updateStatus(requestId, status);
  }
}

module.exports = new AdminService();

const { pool } = require("../config/db");
const { notificationService } = require("./notification.service");
const { v4: uuidv4 } = require("uuid");

class PaymentService {
  /**
   * Create payment/invoice (UC-09A — Owner)
   */
  async createPayment(ownerId, data) {
    const { contract_id, billing_month, amount, due_date, payment_type } = data;

    // Verify contract is ACTIVE and belongs to this owner
    const [contracts] = await pool.query(
      "SELECT * FROM Contracts WHERE id = ? AND owner_id = ? AND status = 'ACTIVE'",
      [contract_id, ownerId],
    );

    if (contracts.length === 0) {
      throw {
        statusCode: 404,
        message: "Không tìm thấy hợp đồng đang hoạt động",
      };
    }

    const contract = contracts[0];

    // Check duplicate: UNIQUE(contract_id, billing_month, payment_type) — UC-09A luồng ngoại lệ 4a
    const [existing] = await pool.query(
      "SELECT id FROM Payments WHERE contract_id = ? AND billing_month = ? AND payment_type = ?",
      [contract_id, billing_month, payment_type],
    );
    if (existing.length > 0) {
      throw {
        statusCode: 400,
        message: "Hóa đơn cùng loại cho tháng này đã tồn tại",
      };
    }

    const [result] = await pool.query(
      `INSERT INTO Payments (contract_id, billing_month, amount, due_date, payment_type, method, status)
       VALUES (?, ?, ?, ?, ?, 'SIMULATED', 'PENDING')`,
      [contract_id, billing_month, amount, due_date || null, payment_type],
    );

    // Notify user
    try {
      await notificationService.create({
        user_id: contract.user_id,
        type: "PAYMENT",
        content: `Hóa đơn thanh toán mới: ${amount.toLocaleString()} VNĐ. Hạn: ${due_date || "Chưa xác định"}`,
        reference_id: result.insertId,
        reference_type: "PAYMENT",
      });
    } catch (e) {
      /* silent */
    }

    return this.getPaymentById(result.insertId);
  }

  /**
   * Get payment by ID
   */
  async getPaymentById(id) {
    const [payments] = await pool.query(
      `SELECT p.*,
              c.room_id, c.user_id, c.owner_id,
              r.title as room_title,
              t.name as user_name,
              o.name as owner_name
       FROM Payments p
       JOIN Contracts c ON p.contract_id = c.id
       JOIN Rooms r ON c.room_id = r.id
       JOIN Users t ON c.user_id = t.id
       JOIN Users o ON c.owner_id = o.id
       WHERE p.id = ?`,
      [id],
    );

    if (payments.length === 0) {
      throw { statusCode: 404, message: "Không tìm thấy hóa đơn" };
    }

    return payments[0];
  }

  /**
   * Simulate payment (UC-09 — User/Tenant)
   */
  async makePayment(paymentId, userId) {
    const [payments] = await pool.query(
      `SELECT p.*, c.user_id, c.owner_id
       FROM Payments p
       JOIN Contracts c ON p.contract_id = c.id
       WHERE p.id = ? AND c.user_id = ? AND p.status = 'PENDING'`,
      [paymentId, userId],
    );

    if (payments.length === 0) {
      throw {
        statusCode: 404,
        message: "Không tìm thấy hóa đơn chờ thanh toán",
      };
    }

    // Generate transaction_code
    const transactionCode = `TXN-${Date.now()}-${uuidv4().substring(0, 8).toUpperCase()}`;

    await pool.query(
      `UPDATE Payments SET status = 'PAID', payment_date = NOW(), transaction_code = ? WHERE id = ?`,
      [transactionCode, paymentId],
    );

    // Notify owner
    try {
      await notificationService.create({
        user_id: payments[0].owner_id,
        type: "PAYMENT",
        content: `Thanh toán ${payments[0].amount.toLocaleString()} VNĐ đã được nhận thành công`,
        reference_id: paymentId,
        reference_type: "PAYMENT",
      });
    } catch (e) {
      /* silent */
    }

    return this.getPaymentById(paymentId);
  }

  /**
   * Get user's payments (UC-09)
   */
  async getUserPayments(userId, page = 1, limit = 10, status = null) {
    const offset = (page - 1) * limit;

    let whereClause = "WHERE c.user_id = ?";
    const paramsCount = [userId];
    const paramsData = [userId];

    if (status) {
      whereClause += " AND p.status = ?";
      paramsCount.push(status);
      paramsData.push(status);
    }

    paramsData.push(parseInt(limit), parseInt(offset));

    const [countResult] = await pool.query(
      `SELECT COUNT(*) as total FROM Payments p
       JOIN Contracts c ON p.contract_id = c.id
       ${whereClause}`,
      paramsCount,
    );

    const [payments] = await pool.query(
      `SELECT p.*,
              r.title as room_title,
              o.name as owner_name
       FROM Payments p
       JOIN Contracts c ON p.contract_id = c.id
       JOIN Rooms r ON c.room_id = r.id
       JOIN Users o ON c.owner_id = o.id
       ${whereClause}
       ORDER BY p.billing_month DESC
       LIMIT ? OFFSET ?`,
      paramsData,
    );

    return {
      payments,
      total: countResult[0].total,
      page: parseInt(page),
      limit: parseInt(limit),
    };
  }

  /**
   * Get owner's payments (UC-09A)
   */
  async getOwnerPayments(ownerId, page = 1, limit = 10, status = null) {
    const offset = (page - 1) * limit;

    let whereClause = "WHERE c.owner_id = ?";
    const paramsCount = [ownerId];
    const paramsData = [ownerId];

    if (status) {
      whereClause += " AND p.status = ?";
      paramsCount.push(status);
      paramsData.push(status);
    }

    paramsData.push(parseInt(limit), parseInt(offset));

    const [countResult] = await pool.query(
      `SELECT COUNT(*) as total FROM Payments p
       JOIN Contracts c ON p.contract_id = c.id
       ${whereClause}`,
      paramsCount,
    );

    const [payments] = await pool.query(
      `SELECT p.*,
              r.title as room_title,
              t.name as user_name
       FROM Payments p
       JOIN Contracts c ON p.contract_id = c.id
       JOIN Rooms r ON c.room_id = r.id
       JOIN Users t ON c.user_id = t.id
       ${whereClause}
       ORDER BY p.billing_month DESC
       LIMIT ? OFFSET ?`,
      paramsData,
    );

    return {
      payments,
      total: countResult[0].total,
      page: parseInt(page),
      limit: parseInt(limit),
    };
  }

  /**
   * Get total revenue for owner
   */
  async getOwnerRevenue(ownerId) {
    const [result] = await pool.query(
      `SELECT SUM(amount) as total_revenue FROM Payments p
       JOIN Contracts c ON p.contract_id = c.id
       WHERE c.owner_id = ? AND p.status = 'PAID'`,
      [ownerId],
    );
    return result[0].total_revenue || 0;
  }
}

module.exports = new PaymentService();

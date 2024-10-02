const { pool } = require("../config/db");
const { notificationService } = require("./notification.service");

class ContractService {
  /**
   * Create contract from approved rental request (UC-07 — Owner)
   */
  async createContract(ownerId, data) {
    const {
      rental_request_id,
      start_date,
      end_date,
      monthly_rent,
      deposit_amount,
      terms,
    } = data;

    // Validate dates
    if (new Date(end_date) <= new Date(start_date)) {
      throw { statusCode: 400, message: "Ngày kết thúc phải sau ngày bắt đầu" };
    }

    // Verify rental request is APPROVED and belongs to owner's room
    const [requests] = await pool.query(
      `SELECT rr.*, r.title as room_title, r.owner_id, r.id as room_id
       FROM RentalRequests rr
       JOIN Rooms r ON rr.room_id = r.id
       WHERE rr.id = ? AND r.owner_id = ? AND rr.status = 'APPROVED'`,
      [rental_request_id, ownerId],
    );

    if (requests.length === 0) {
      throw {
        statusCode: 404,
        message: "Không tìm thấy yêu cầu thuê đã duyệt",
      };
    }

    const request = requests[0];

    // Check no existing contract for this request
    const [existingContract] = await pool.query(
      "SELECT id FROM Contracts WHERE rental_request_id = ?",
      [rental_request_id],
    );
    if (existingContract.length > 0) {
      throw { statusCode: 400, message: "Hợp đồng đã tồn tại cho yêu cầu này" };
    }

    const [result] = await pool.query(
      `INSERT INTO Contracts (rental_request_id, owner_id, user_id, room_id, monthly_rent, deposit, start_date, end_date, terms, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'PENDING')`,
      [
        rental_request_id,
        ownerId,
        request.user_id,
        request.room_id,
        monthly_rent,
        deposit_amount || null,
        start_date,
        end_date,
        terms || null,
      ],
    );

    // Notify user (UC-07 step 5)
    try {
      await notificationService.create({
        user_id: request.user_id,
        type: "CONTRACT",
        content: `Hợp đồng thuê phòng "${request.room_title}" đã được tạo. Vui lòng xem xét và ký xác nhận.`,
        reference_id: result.insertId,
        reference_type: "CONTRACT",
      });
    } catch (e) {
      /* silent */
    }

    return this.getContractById(result.insertId);
  }

  /**
   * Get contract by ID
   */
  async getContractById(id) {
    const [contracts] = await pool.query(
      `SELECT c.*,
              r.title as room_title, r.city as room_city, r.district as room_district, r.price as room_price,
              COALESCE(c.monthly_rent, r.price) as monthly_rent, c.deposit as deposit_amount,
              t.name as user_name, t.email as user_email, t.phone as user_phone,
              o.name as owner_name, o.email as owner_email, o.phone as owner_phone
       FROM Contracts c
       JOIN Rooms r ON c.room_id = r.id
       JOIN Users t ON c.user_id = t.id
       JOIN Users o ON c.owner_id = o.id
       WHERE c.id = ?`,
      [id],
    );

    if (contracts.length === 0) {
      throw { statusCode: 404, message: "Không tìm thấy hợp đồng" };
    }

    return contracts[0];
  }

  /**
   * Get user's contracts (UC-08 — User/Tenant)
   */
  async getUserContracts(userId, page = 1, limit = 10) {
    const offset = (page - 1) * limit;
    const [countResult] = await pool.query(
      "SELECT COUNT(*) as total FROM Contracts WHERE user_id = ?",
      [userId],
    );

    const [contracts] = await pool.query(
      `SELECT c.*,
              r.title as room_title, r.city as room_city, COALESCE(c.monthly_rent, r.price) as monthly_rent,
              c.deposit as deposit_amount,
              o.name as owner_name
       FROM Contracts c
       JOIN Rooms r ON c.room_id = r.id
       JOIN Users o ON c.owner_id = o.id
       WHERE c.user_id = ?
       ORDER BY c.created_at DESC
       LIMIT ? OFFSET ?`,
      [userId, parseInt(limit), parseInt(offset)],
    );

    return {
      contracts,
      total: countResult[0].total,
      page: parseInt(page),
      limit: parseInt(limit),
    };
  }

  /**
   * Get owner's contracts (UC-07)
   */
  async getOwnerContracts(ownerId, page = 1, limit = 10) {
    const offset = (page - 1) * limit;
    const [countResult] = await pool.query(
      "SELECT COUNT(*) as total FROM Contracts WHERE owner_id = ?",
      [ownerId],
    );

    const [contracts] = await pool.query(
      `SELECT c.*,
              r.title as room_title, r.city as room_city, COALESCE(c.monthly_rent, r.price) as monthly_rent,
              c.deposit as deposit_amount,
              t.name as user_name, t.email as user_email
       FROM Contracts c
       JOIN Rooms r ON c.room_id = r.id
       JOIN Users t ON c.user_id = t.id
       WHERE c.owner_id = ?
       ORDER BY c.created_at DESC
       LIMIT ? OFFSET ?`,
      [ownerId, parseInt(limit), parseInt(offset)],
    );

    return {
      contracts,
      total: countResult[0].total,
      page: parseInt(page),
      limit: parseInt(limit),
    };
  }

  /**
   * Sign/confirm contract (UC-08 — User)
   * When user signs → status = ACTIVE, room → RENTED
   */
  async signContract(contractId, userId) {
    // Validate contract exists and belongs to user
    const [contracts] = await pool.query(
      "SELECT * FROM Contracts WHERE id = ? AND user_id = ? AND status = 'PENDING'",
      [contractId, userId],
    );

    if (contracts.length === 0) {
      throw {
        statusCode: 404,
        message: "Hợp đồng không tồn tại hoặc đã được xử lý",
      };
    }

    const contract = contracts[0];

    // ── Transaction: 4 tables must update atomically ──────────
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      // UC-08: User ký → ACTIVE + signed_at
      await conn.query(
        "UPDATE Contracts SET status = 'ACTIVE', signed_at = NOW() WHERE id = ?",
        [contractId],
      );

      // Mark room as RENTED
      await conn.query("UPDATE Rooms SET status = 'RENTED' WHERE id = ?", [
        contract.room_id,
      ]);

      // Auto cancel other PENDING contracts for this room
      await conn.query(
        "UPDATE Contracts SET status = 'CANCELLED', cancelled_at = NOW() WHERE room_id = ? AND id != ? AND status = 'PENDING'",
        [contract.room_id, contractId],
      );

      // Auto reject other PENDING or APPROVED rental requests for this room
      await conn.query(
        "UPDATE RentalRequests SET status = 'REJECTED', reject_reason = 'Phòng đã được cho thuê' WHERE room_id = ? AND status IN ('PENDING', 'APPROVED') AND id != ?",
        [contract.room_id, contract.rental_request_id],
      );

      await conn.commit();
    } catch (error) {
      await conn.rollback();
      throw error;
    } finally {
      conn.release();
    }

    // Notify owner (outside transaction — notification failure should not rollback)
    try {
      await notificationService.create({
        user_id: contract.owner_id,
        type: "CONTRACT",
        content:
          "Hợp đồng đã được người thuê ký xác nhận và bây giờ đang hoạt động.",
        reference_id: contractId,
        reference_type: "CONTRACT",
      });
    } catch (e) {
      /* silent */
    }

    return this.getContractById(contractId);
  }

  /**
   * Cancel contract (UC-08 luồng ngoại lệ — User refuses)
   */
  async cancelContract(contractId, userId) {
    const [contracts] = await pool.query(
      "SELECT * FROM Contracts WHERE id = ? AND user_id = ? AND status = 'PENDING'",
      [contractId, userId],
    );

    if (contracts.length === 0) {
      throw {
        statusCode: 404,
        message: "Hợp đồng không tồn tại hoặc không thể hủy",
      };
    }

    // ── Transaction ──────────
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      await conn.query(
        "UPDATE Contracts SET status = 'CANCELLED', cancelled_at = NOW() WHERE id = ?",
        [contractId],
      );

      await conn.query(
        "UPDATE RentalRequests SET status = 'REJECTED', reject_reason = 'Người thuê từ chối ký hợp đồng' WHERE id = ?",
        [contracts[0].rental_request_id],
      );

      await conn.commit();
    } catch (error) {
      await conn.rollback();
      throw error;
    } finally {
      conn.release();
    }

    // Notify owner
    try {
      await notificationService.create({
        user_id: contracts[0].owner_id,
        type: "CONTRACT",
        content: "Người thuê đã từ chối ký hợp đồng.",
        reference_id: contractId,
        reference_type: "CONTRACT",
      });
    } catch (e) {
      /* silent */
    }

    return this.getContractById(contractId);
  }

  /**
   * Terminate contract (Owner)
   */
  async terminateContract(contractId, ownerId) {
    const [contracts] = await pool.query(
      "SELECT * FROM Contracts WHERE id = ? AND owner_id = ? AND status = 'ACTIVE'",
      [contractId, ownerId],
    );

    if (contracts.length === 0) {
      throw {
        statusCode: 404,
        message: "Hợp đồng không tồn tại hoặc không thể chấm dứt",
      };
    }

    const contract = contracts[0];

    // ── Transaction: 2 tables must update atomically ──────────
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      // Update contract to CANCELLED
      await conn.query(
        "UPDATE Contracts SET status = 'CANCELLED', cancelled_at = NOW() WHERE id = ?",
        [contractId],
      );

      // Revert room back to AVAILABLE
      await conn.query("UPDATE Rooms SET status = 'AVAILABLE' WHERE id = ?", [
        contract.room_id,
      ]);

      await conn.commit();
    } catch (error) {
      await conn.rollback();
      throw error;
    } finally {
      conn.release();
    }

    // Notify user (outside transaction)
    try {
      await notificationService.create({
        user_id: contract.user_id,
        type: "CONTRACT",
        content: "Chủ trọ đã chấm dứt hợp đồng thuê phòng của bạn.",
        reference_id: contractId,
        reference_type: "CONTRACT",
      });
    } catch (e) {
      /* silent */
    }

    return this.getContractById(contractId);
  }
}

module.exports = new ContractService();

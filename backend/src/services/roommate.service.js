const { pool } = require("../config/db");
const { notificationService } = require("./notification.service");

class RoommateService {
  // ── Tags ──────────────────────────────────────────────────
  /**
   * Get all available tags for the profile form
   */
  async getAllTags() {
    const [tags] = await pool.query("SELECT id, name FROM Tags ORDER BY name");
    return tags;
  }

  /**
   * Get tags selected by a specific profile
   */
  async getProfileTags(profileId) {
    const [tags] = await pool.query(
      `SELECT t.id, t.name
       FROM ProfileTags pt
       JOIN Tags t ON pt.tag_id = t.id
       WHERE pt.profile_id = ?
       ORDER BY t.name`,
      [profileId],
    );
    return tags;
  }

  /**
   * Count common tags between two profiles (for matching algorithm)
   */
  async countCommonTags(profileIdA, profileIdB) {
    const [result] = await pool.query(
      `SELECT COUNT(*) AS common_tags
       FROM ProfileTags pt1
       JOIN ProfileTags pt2 ON pt1.tag_id = pt2.tag_id
       WHERE pt1.profile_id = ? AND pt2.profile_id = ?`,
      [profileIdA, profileIdB],
    );
    return result[0].common_tags;
  }

  // ── Profile CRUD ──────────────────────────────────────────
  /**
   * Create or update roommate profile (UC 2.7)
   * Uses transaction for replace-all tag update
   */
  async createOrUpdateProfile(userId, data) {
    const {
      gender,
      birth_date,
      budget,
      cleanliness,
      sleep_time,
      work_schedule,
      is_smoking,
      has_pet,
      bio,
      is_search_active,
      tag_ids,
    } = data;

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      const [existing] = await connection.query(
        "SELECT id FROM RoommateProfiles WHERE user_id = ?",
        [userId],
      );

      let profileId;

      if (existing.length > 0) {
        profileId = existing[0].id;
        // Update profile
        await connection.query(
          `UPDATE RoommateProfiles
           SET gender = ?, birth_date = ?, budget = ?, cleanliness = ?,
               sleep_time = ?, work_schedule = ?, is_smoking = ?, has_pet = ?, bio = ?,
               is_search_active = ?
           WHERE user_id = ?`,
          [
            gender,
            birth_date || null,
            budget || null,
            cleanliness,
            sleep_time,
            work_schedule,
            is_smoking || false,
            has_pet || false,
            bio || null,
            is_search_active !== undefined ? is_search_active : true,
            userId,
          ],
        );
      } else {
        // Create profile
        const [insertResult] = await connection.query(
          `INSERT INTO RoommateProfiles
           (user_id, gender, birth_date, budget, cleanliness, sleep_time, work_schedule, is_smoking, has_pet, bio, is_search_active)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            userId,
            gender,
            birth_date || null,
            budget || null,
            cleanliness,
            sleep_time,
            work_schedule,
            is_smoking || false,
            has_pet || false,
            bio || null,
            is_search_active !== undefined ? is_search_active : true,
          ],
        );
        profileId = insertResult.insertId;
      }

      // Replace-all tags (delete old → insert new) within same transaction
      if (Array.isArray(tag_ids)) {
        await connection.query("DELETE FROM ProfileTags WHERE profile_id = ?", [
          profileId,
        ]);

        if (tag_ids.length > 0) {
          const values = tag_ids.map((tagId) => [profileId, parseInt(tagId)]);
          await connection.query(
            "INSERT INTO ProfileTags (profile_id, tag_id) VALUES ?",
            [values],
          );
        }
      }

      await connection.commit();
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }

    return this.getProfile(userId);
  }

  /**
   * Get own profile (with tags)
   */
  async getProfile(userId) {
    const [profiles] = await pool.query(
      `SELECT rp.*, u.name, u.email
       FROM RoommateProfiles rp
       JOIN Users u ON rp.user_id = u.id
       WHERE rp.user_id = ?`,
      [userId],
    );

    if (profiles.length === 0) {
      throw { statusCode: 404, message: "Chưa có hồ sơ ở ghép" };
    }

    const profile = profiles[0];
    // Attach tags
    profile.tags = await this.getProfileTags(profile.id);
    return profile;
  }

  // ── Matching Algorithm ────────────────────────────────────
  /**
   * Find matches for a user
   */
  async findMatches(userId, page = 1, limit = 10, filters = {}) {
    // 1. Get current user's profile
    const [userProfiles] = await pool.query(
      `SELECT * FROM RoommateProfiles WHERE user_id = ?`,
      [userId],
    );

    if (userProfiles.length === 0) {
      throw {
        statusCode: 400,
        message: "Vui lòng tạo hồ sơ ở ghép trước khi tìm kiếm",
      };
    }

    const myProfile = userProfiles[0];

    // Build SQL for Hard Filters
    let sql = `SELECT rp.*, u.name
               FROM RoommateProfiles rp
               JOIN Users u ON rp.user_id = u.id
               WHERE rp.user_id != ? AND rp.is_search_active = TRUE`;
    const params = [userId];

    if (filters.gender) {
      sql += ` AND rp.gender = ?`;
      params.push(filters.gender);
    }

    if (filters.is_smoking !== undefined && filters.is_smoking !== "") {
      sql += ` AND rp.is_smoking = ?`;
      params.push(filters.is_smoking === "true" ? 1 : 0);
    }

    if (filters.has_pet !== undefined && filters.has_pet !== "") {
      sql += ` AND rp.has_pet = ?`;
      params.push(filters.has_pet === "true" ? 1 : 0);
    }

    // 2. Get all other profiles matching hard filters
    const [otherProfiles] = await pool.query(sql, params);

    // 3. Calculate compatibility scores
    let matches = [];
    for (const theirProfile of otherProfiles) {
      let score = 0;

      // a. Budget Similarity (25 pts)
      if (myProfile.budget && theirProfile.budget) {
        const myBudget = parseFloat(myProfile.budget);
        const theirBudget = parseFloat(theirProfile.budget);
        const maxBudget = Math.max(myBudget, theirBudget);
        const budgetSimilarity =
          maxBudget > 0 ? 1 - Math.abs(myBudget - theirBudget) / maxBudget : 0;
        score += budgetSimilarity * 25;
      }

      // b. Sleep Time Match (20 pts)
      if (myProfile.sleep_time === theirProfile.sleep_time) score += 20;
      else if (
        myProfile.sleep_time === "FLEXIBLE" ||
        theirProfile.sleep_time === "FLEXIBLE"
      )
        score += 14;

      // c. Smoking Match (15 pts)
      if (myProfile.is_smoking === theirProfile.is_smoking) score += 15;

      // d. Tags Common (15 pts) — NEW
      const commonTags = await this.countCommonTags(
        myProfile.id,
        theirProfile.id,
      );
      const tagScore = Math.min(commonTags * 3, 15);
      score += tagScore;

      // e. Cleanliness Diff (10 pts)
      if (myProfile.cleanliness && theirProfile.cleanliness) {
        const cleanlinessDiff =
          1 - Math.abs(myProfile.cleanliness - theirProfile.cleanliness) / 4;
        score += cleanlinessDiff * 10;
      }

      // f. Work Schedule Match (10 pts)
      if (myProfile.work_schedule === theirProfile.work_schedule) score += 10;
      else if (
        myProfile.work_schedule === "FLEXIBLE" ||
        theirProfile.work_schedule === "FLEXIBLE"
      )
        score += 7;

      // g. Pet Preference Match (5 pts)
      if (myProfile.has_pet === theirProfile.has_pet) score += 5;

      const finalScore = Math.round(score * 100) / 100;

      // Apply Soft Filter (minScore)
      const minScoreThreshold = filters.minScore
        ? parseInt(filters.minScore)
        : 0;
      if (finalScore >= minScoreThreshold) {
        // Attach tags to profile for display only if they pass the threshold
        theirProfile.tags = await this.getProfileTags(theirProfile.id);

        matches.push({
          ...theirProfile,
          compatibility_score: finalScore,
          common_tags: commonTags,
        });
      }
    }

    // 4. Sort by score DESC
    matches.sort((a, b) => b.compatibility_score - a.compatibility_score);

    // 5. Upsert into RoommateMatches table
    for (const match of matches) {
      const user1 = Math.min(userId, match.user_id);
      const user2 = Math.max(userId, match.user_id);
      try {
        await pool.query(
          `INSERT INTO RoommateMatches (user1_id, user2_id, score, status)
           VALUES (?, ?, ?, 'SUGGESTED')
           ON DUPLICATE KEY UPDATE score = ?, updated_at = NOW()`,
          [user1, user2, match.compatibility_score, match.compatibility_score],
        );
      } catch (e) {
        /* ignore constraint errors */
      }
    }

    // 6. Paginate results
    const offset = (page - 1) * limit;
    const paginatedMatches = matches.slice(offset, offset + parseInt(limit));

    return {
      matches: paginatedMatches,
      total: matches.length,
      page: parseInt(page),
      limit: parseInt(limit),
    };
  }

  /**
   * Get match detail (view a specific matched user, with tags)
   */
  async getMatchDetail(userId, targetUserId) {
    const [profiles] = await pool.query(
      `SELECT rp.*, u.name, u.email
       FROM RoommateProfiles rp
       JOIN Users u ON rp.user_id = u.id
       WHERE rp.user_id = ?`,
      [targetUserId],
    );

    if (profiles.length === 0) {
      throw { statusCode: 404, message: "Không tìm thấy hồ sơ người dùng" };
    }

    // Update match status to VIEWED
    const user1 = Math.min(userId, targetUserId);
    const user2 = Math.max(userId, targetUserId);
    await pool.query(
      "UPDATE RoommateMatches SET status = 'VIEWED' WHERE user1_id = ? AND user2_id = ? AND status = 'SUGGESTED'",
      [user1, user2],
    );

    const profile = profiles[0];
    // Attach tags
    profile.tags = await this.getProfileTags(profile.id);
    return profile;
  }

  // ── Requests ──────────────────────────────────────────────
  /**
   * Send roommate request (UC 2.7)
   * Reverse duplicate check at service layer
   */
  async sendRequest(senderId, receiverId, message) {
    if (senderId === receiverId) {
      throw {
        statusCode: 400,
        message: "Không thể gửi yêu cầu cho chính mình",
      };
    }

    // Check if receiver has a profile
    const [profiles] = await pool.query(
      "SELECT id FROM RoommateProfiles WHERE user_id = ?",
      [receiverId],
    );
    if (profiles.length === 0) {
      throw { statusCode: 404, message: "Người nhận chưa có hồ sơ ở ghép" };
    }

    // Check for existing request in EITHER direction (reverse duplicate prevention)
    const [existing] = await pool.query(
      `SELECT id, status FROM RoommateRequests
       WHERE (sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?)`,
      [senderId, receiverId, receiverId, senderId],
    );

    if (existing.length > 0) {
      throw {
        statusCode: 400,
        message: `Yêu cầu ghép đôi đã tồn tại (Trạng thái: ${existing[0].status})`,
      };
    }

    const [result] = await pool.query(
      "INSERT INTO RoommateRequests (sender_id, receiver_id, message, status) VALUES (?, ?, ?, 'PENDING')",
      [senderId, receiverId, message || null],
    );

    // Notify receiver
    try {
      const [senderInfo] = await pool.query(
        "SELECT name FROM Users WHERE id = ?",
        [senderId],
      );
      await notificationService.create({
        user_id: receiverId,
        type: "ROOMMATE_REQUEST",
        content: `${senderInfo[0].name} đã gửi cho bạn yêu cầu ghép đôi.`,
        reference_id: result.insertId,
        reference_type: "ROOMMATE_REQUEST",
      });
    } catch (e) {
      /* silent */
    }

    return {
      id: result.insertId,
      sender_id: senderId,
      receiver_id: receiverId,
      status: "PENDING",
    };
  }

  /**
   * Respond to roommate request — accept/reject (UC 2.7)
   */
  async respondToRequest(requestId, userId, status) {
    const normalizedStatus = status ? status.toUpperCase() : "";
    if (!["ACCEPTED", "REJECTED"].includes(normalizedStatus)) {
      throw { statusCode: 400, message: "Trạng thái không hợp lệ" };
    }

    const [requests] = await pool.query(
      "SELECT * FROM RoommateRequests WHERE id = ? AND receiver_id = ? AND status = 'PENDING'",
      [requestId, userId],
    );

    if (requests.length === 0) {
      throw {
        statusCode: 404,
        message: "Yêu cầu không tồn tại hoặc đã được xử lý",
      };
    }

    // ── Transaction: đồng bộ RoommateRequests + RoommateMatches ──
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      await conn.query("UPDATE RoommateRequests SET status = ? WHERE id = ?", [
        normalizedStatus,
        requestId,
      ]);

      // If accepted, update RoommateMatches to CONNECTED
      if (normalizedStatus === "ACCEPTED") {
        const user1 = Math.min(requests[0].sender_id, userId);
        const user2 = Math.max(requests[0].sender_id, userId);
        await conn.query(
          "UPDATE RoommateMatches SET status = 'CONNECTED' WHERE user1_id = ? AND user2_id = ?",
          [user1, user2],
        );
      }

      await conn.commit();
    } catch (error) {
      await conn.rollback();
      throw error;
    } finally {
      conn.release();
    }

    // Notify sender (outside transaction)
    try {
      const statusText =
        normalizedStatus === "ACCEPTED" ? "chấp nhận" : "từ chối";
      await notificationService.create({
        user_id: requests[0].sender_id,
        type: "ROOMMATE_REQUEST",
        content: `Yêu cầu ghép đôi của bạn đã được ${statusText}.`,
        reference_id: requestId,
        reference_type: "ROOMMATE_REQUEST",
      });
    } catch (e) {
      /* silent */
    }

    return {
      id: requestId,
      status: normalizedStatus,
      message: `Yêu cầu đã ${normalizedStatus === "ACCEPTED" ? "chấp nhận" : "từ chối"}`,
    };
  }

  /**
   * Get received requests
   */
  async getReceivedRequests(userId, page = 1, limit = 10) {
    const offset = (page - 1) * limit;

    const [countResult] = await pool.query(
      "SELECT COUNT(*) as total FROM RoommateRequests WHERE receiver_id = ?",
      [userId],
    );

    const [requests] = await pool.query(
      `SELECT r.*, u.name as sender_name, IF(r.status = 'ACCEPTED', u.email, NULL) as sender_email, IF(r.status = 'ACCEPTED', u.phone, NULL) as sender_phone, rp.bio
       FROM RoommateRequests r
       JOIN Users u ON r.sender_id = u.id
       LEFT JOIN RoommateProfiles rp ON r.sender_id = rp.user_id
       WHERE r.receiver_id = ?
       ORDER BY r.created_at DESC LIMIT ? OFFSET ?`,
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
   * Get sent requests
   */
  async getSentRequests(userId, page = 1, limit = 10) {
    const offset = (page - 1) * limit;

    const [countResult] = await pool.query(
      "SELECT COUNT(*) as total FROM RoommateRequests WHERE sender_id = ?",
      [userId],
    );

    const [requests] = await pool.query(
      `SELECT r.*, u.name as receiver_name, IF(r.status = 'ACCEPTED', u.email, NULL) as receiver_email, IF(r.status = 'ACCEPTED', u.phone, NULL) as receiver_phone
       FROM RoommateRequests r
       JOIN Users u ON r.receiver_id = u.id
       WHERE r.sender_id = ?
       ORDER BY r.created_at DESC LIMIT ? OFFSET ?`,
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
   * Cancel a pending request or unmatch an accepted one
   */
  async unmatchOrCancelRequest(requestId, userId) {
    const [requests] = await pool.query(
      "SELECT * FROM RoommateRequests WHERE id = ? AND (sender_id = ? OR receiver_id = ?)",
      [requestId, userId, userId],
    );

    if (requests.length === 0) {
      throw { statusCode: 404, message: "Yêu cầu không tồn tại" };
    }

    const request = requests[0];

    if (request.status !== "ACCEPTED" && request.sender_id !== userId) {
      throw { statusCode: 403, message: "Bạn không có quyền hủy yêu cầu này" };
    }

    // ── Transaction: đồng bộ xóa request + revert match ──
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      await conn.query("DELETE FROM RoommateRequests WHERE id = ?", [requestId]);

      if (request.status === "ACCEPTED") {
        const user1 = Math.min(request.sender_id, request.receiver_id);
        const user2 = Math.max(request.sender_id, request.receiver_id);
        await conn.query(
          "UPDATE RoommateMatches SET status = 'SUGGESTED' WHERE user1_id = ? AND user2_id = ?",
          [user1, user2],
        );
      }

      await conn.commit();
    } catch (error) {
      await conn.rollback();
      throw error;
    } finally {
      conn.release();
    }

    return { message: "Đã hủy thành công" };
  }
}

module.exports = new RoommateService();

const { pool } = require("../config/db");
const bcrypt = require("bcryptjs");

class UserService {
  /**
   * Get user profile by ID
   */
  async getUserById(userId) {
    const [users] = await pool.query(
      "SELECT id, name, email, phone, role, status, avatar_url, created_at, updated_at FROM Users WHERE id = ?",
      [userId],
    );

    if (users.length === 0) {
      throw { statusCode: 404, message: "Không tìm thấy người dùng" };
    }

    return users[0];
  }

  /**
   * Update user profile
   */
  async updateProfile(userId, data) {
    const { name, phone } = data;

    const updates = [];
    const values = [];

    if (name) {
      updates.push("name = ?");
      values.push(name);
    }
    if (phone !== undefined) {
      updates.push("phone = ?");
      values.push(phone);
    }

    if (updates.length > 0) {
      values.push(userId);
      await pool.query(
        `UPDATE Users SET ${updates.join(", ")} WHERE id = ?`,
        values,
      );
    }

    return this.getUserById(userId);
  }

  /**
   * Change user password
   */
  async changePassword(userId, oldPassword, newPassword) {
    const [users] = await pool.query(
      "SELECT password FROM Users WHERE id = ?",
      [userId],
    );
    if (users.length === 0) {
      throw { statusCode: 404, message: "Không tìm thấy người dùng" };
    }
    const user = users[0];
    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      throw { statusCode: 400, message: "Mật khẩu cũ không chính xác" };
    }
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    await pool.query("UPDATE Users SET password = ? WHERE id = ?", [
      hashedPassword,
      userId,
    ]);
    return { message: "Đổi mật khẩu thành công" };
  }

  /**
   * Update user avatar
   */
  async updateAvatar(userId, avatarUrl) {
    await pool.query("UPDATE Users SET avatar_url = ? WHERE id = ?", [
      avatarUrl,
      userId,
    ]);
    return { avatar_url: avatarUrl };
  }
}
module.exports = new UserService();

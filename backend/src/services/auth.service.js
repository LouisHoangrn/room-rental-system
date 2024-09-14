const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { pool } = require("../config/db");

class AuthService {
  /**
   * Register a new user (UC-01)
   */
  async register({ email, password, name, phone, role = "USER" }) {
    // Check if email already exists
    const [existing] = await pool.query(
      "SELECT id FROM Users WHERE email = ?",
      [email],
    );
    if (existing.length > 0) {
      throw { statusCode: 409, message: "Email này đã được sử dụng" };
    }

    // Prevent registering as admin
    if (role === "ADMIN") {
      throw { statusCode: 403, message: "Không thể đăng ký tài khoản Admin" };
    }

    // Validate role
    if (!["USER", "OWNER"].includes(role)) {
      throw { statusCode: 400, message: "Vai trò phải là USER hoặc OWNER" };
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Insert user
    const [result] = await pool.query(
      `INSERT INTO Users (name, email, password, phone, role) 
       VALUES (?, ?, ?, ?, ?)`,
      [name, email, hashedPassword, phone || null, role],
    );

    // Generate token
    const token = this.generateToken({ id: result.insertId, email, role });

    return {
      token,
      user: {
        id: result.insertId,
        name,
        email,
        phone,
        role,
        status: "ACTIVE",
      },
    };
  }

  /**
   * Login user (UC-02, UC-17)
   */
  async login(email, password) {
    // Find user
    const [users] = await pool.query(
      "SELECT id, name, email, password, phone, role, status, avatar_url FROM Users WHERE email = ?",
      [email],
    );

    if (users.length === 0) {
      throw { statusCode: 401, message: "Thông tin đăng nhập không chính xác" };
    }

    const user = users[0];

    // Check if user is active (UC-02 luồng ngoại lệ 3b)
    if (user.status === "BLOCKED") {
      throw {
        statusCode: 403,
        message: "Tài khoản của bạn đã bị khóa, vui lòng liên hệ Admin",
      };
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw { statusCode: 401, message: "Thông tin đăng nhập không chính xác" };
    }

    // Generate token
    const token = this.generateToken({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    // Remove password from response
    delete user.password;

    return { token, user };
  }

  /**
   * Get current user profile
   */
  async getMe(userId) {
    const [users] = await pool.query(
      "SELECT id, name, email, phone, role, status, avatar_url, created_at FROM Users WHERE id = ?",
      [userId],
    );

    if (users.length === 0) {
      throw { statusCode: 404, message: "Không tìm thấy người dùng" };
    }

    return users[0];
  }



  /**
   * Generate JWT token
   */
  generateToken(payload) {
    return jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || "7d",
    });
  }
}

module.exports = new AuthService();

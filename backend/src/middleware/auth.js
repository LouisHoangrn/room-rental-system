/**
 * Authentication & Authorization Middleware
 *
 * - authenticate: Verifies JWT from the Authorization header and attaches
 *   the decoded user payload to req.user. Also checks if account is BLOCKED.
 * - authorize: Role-based access control — restricts routes to specific roles.
 */

const jwt = require("jsonwebtoken");
const { pool } = require("../config/db");
const { sendError } = require("../utils/response");

/**
 * JWT authentication middleware.
 *
 * Expects the Authorization header in the format: "Bearer <token>"
 * On success, attaches the decoded token payload to req.user.
 * On failure, responds with 401 Unauthorized.
 * Also checks if the account has been BLOCKED since login (UC-02 luồng ngoại lệ 3b).
 */
const authenticate = async (req, res, next) => {
  try {
    // Extract the Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return sendError(
        res,
        "Vui lòng đăng nhập để thực hiện chức năng này.",
        401,
      );
    }

    // Pull the token from "Bearer <token>"
    const token = authHeader.split(" ")[1];

    if (!token) {
      return sendError(
        res,
        "Vui lòng đăng nhập để thực hiện chức năng này.",
        401,
      );
    }

    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // ── Check if account is still active (real-time BLOCKED check) ──
    const [users] = await pool.query("SELECT status FROM Users WHERE id = ?", [
      decoded.id,
    ]);

    if (users.length === 0) {
      return sendError(res, "Tài khoản không tồn tại.", 401);
    }

    if (users[0].status === "BLOCKED") {
      return sendError(
        res,
        "Tài khoản của bạn đã bị khóa, vui lòng liên hệ Admin.",
        403,
      );
    }

    // Attach user info to the request object for downstream handlers
    req.user = decoded;

    next();
  } catch (error) {
    // Differentiate between token expiry and other JWT errors
    if (error.name === "TokenExpiredError") {
      return sendError(
        res,
        "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.",
        401,
      );
    }
    if (error.name === "JsonWebTokenError") {
      return sendError(
        res,
        "Phiên đăng nhập không hợp lệ. Vui lòng đăng nhập lại.",
        401,
      );
    }
    if (error.name === "NotBeforeError") {
      return sendError(res, "Tài khoản chưa được kích hoạt.", 401);
    }

    return sendError(res, "Xác thực thất bại. Vui lòng thử lại.", 401);
  }
};

/**
 * Role-based authorization middleware factory.
 *
 * Usage: authorize('admin', 'landlord')
 * Checks that req.user.role (set by authenticate) is one of the allowed roles.
 * Responds with 403 Forbidden if the user's role is not permitted.
 *
 * @param  {...string} roles - Allowed role names
 * @returns {Function} Express middleware
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    // authenticate middleware must run first
    if (!req.user) {
      return sendError(
        res,
        "Vui lòng đăng nhập để thực hiện chức năng này.",
        401,
      );
    }

    if (!roles.includes(req.user.role)) {
      const roleMap = {
        USER: "Người thuê",
        OWNER: "Chủ trọ",
        ADMIN: "Ban quản trị",
      };
      const requiredRolesText = roles
        .map((r) => roleMap[r] || r)
        .join(" hoặc ");

      return sendError(
        res,
        `Truy cập bị từ chối. Tính năng này chỉ dành cho ${requiredRolesText}.`,
        403,
      );
    }

    next();
  };
};

module.exports = { authenticate, authorize };

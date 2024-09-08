/**
 * Centralized Error Handling Middleware
 *
 * - errorHandler: Catches all errors thrown/passed via next(err) and returns
 *   a consistent JSON error response. Handles Multer, JWT, MySQL, and
 *   express-validator errors with specific messages.
 * - notFound: Catches requests to undefined routes and returns 404.
 */

const { sendError } = require("../utils/response");

/**
 * Global error handler middleware.
 * Must be registered AFTER all routes.
 *
 * @param {Error} err - The error object
 * @param {import('express').Request} req - Express request
 * @param {import('express').Response} res - Express response
 * @param {import('express').NextFunction} next - Express next function
 */
const errorHandler = (err, req, res, next) => {
  // Log the error for server-side debugging
  console.error("─── Error Handler ───");
  console.error(`  Path: ${req.method} ${req.originalUrl}`);
  console.error(`  Message: ${err.message}`);
  if (process.env.NODE_ENV !== "production") {
    console.error(`  Stack: ${err.stack}`);
  }
  console.error("─────────────────────");

  // ── Multer errors (file upload) ──────────────────────────────────────
  if (err.name === "MulterError") {
    const multerMessages = {
      LIMIT_FILE_SIZE: "Dung lượng file vượt quá giới hạn cho phép (5MB).",
      LIMIT_FILE_COUNT: "Tải lên quá nhiều file. Tối đa 5 file.",
      LIMIT_UNEXPECTED_FILE: `Trường dữ liệu file không hợp lệ: "${err.field}".`,
      LIMIT_PART_COUNT: "Quá nhiều thành phần trong request.",
      LIMIT_FIELD_KEY: "Tên trường quá dài.",
      LIMIT_FIELD_VALUE: "Giá trị trường quá dài.",
      LIMIT_FIELD_COUNT: "Quá nhiều trường trong request.",
    };

    const message = multerMessages[err.code] || "Lỗi tải lên file.";
    return sendError(res, message, 400);
  }

  // ── Multer custom errors (e.g. file filter rejection) ────────────────
  if (err.message && err.message.startsWith("Invalid file type")) {
    return sendError(res, err.message, 400);
  }

  // ── Express-validator errors ─────────────────────────────────────────
  if (err.array && typeof err.array === "function") {
    const validationErrors = err.array();
    return sendError(
      res,
      "Dữ liệu đầu vào không hợp lệ.",
      422,
      validationErrors,
    );
  }

  // ── JWT errors ───────────────────────────────────────────────────────
  if (err.name === "JsonWebTokenError") {
    return sendError(res, "Phiên đăng nhập không hợp lệ.", 401);
  }
  if (err.name === "TokenExpiredError") {
    return sendError(res, "Phiên đăng nhập đã hết hạn.", 401);
  }
  if (err.name === "NotBeforeError") {
    return sendError(res, "Tài khoản chưa được kích hoạt.", 401);
  }

  // ── MySQL / mysql2 errors ────────────────────────────────────────────
  if (err.code && err.code.startsWith("ER_")) {
    const mysqlMessages = {
      ER_DUP_ENTRY: "Dữ liệu đã tồn tại trong hệ thống.",
      ER_NO_REFERENCED_ROW_2:
        "Dữ liệu tham chiếu không tìm thấy. Khóa ngoại không hợp lệ.",
      ER_ROW_IS_REFERENCED_2:
        "Không thể xóa. Dữ liệu này đang được tham chiếu bởi dữ liệu khác.",
      ER_DATA_TOO_LONG: "Dữ liệu quá dài cho một hoặc nhiều trường.",
      ER_BAD_NULL_ERROR: "Thiếu trường dữ liệu bắt buộc.",
      ER_PARSE_ERROR: "Lỗi cú pháp truy vấn cơ sở dữ liệu.",
      ER_ACCESS_DENIED_ERROR: "Lỗi từ chối truy cập cơ sở dữ liệu.",
      ER_BAD_DB_ERROR: "Cơ sở dữ liệu không tồn tại.",
      ER_NO_SUCH_TABLE: "Bảng cơ sở dữ liệu không tìm thấy.",
    };

    const message =
      mysqlMessages[err.code] || "Đã xảy ra lỗi với cơ sở dữ liệu.";
    const statusCode = err.code === "ER_DUP_ENTRY" ? 409 : 500;
    return sendError(res, message, statusCode);
  }

  // ── MySQL connection errors ──────────────────────────────────────────
  if (err.code === "ECONNREFUSED") {
    return sendError(
      res,
      "Kết nối CSDL bị từ chối. Vui lòng thử lại sau.",
      503,
    );
  }
  if (err.code === "PROTOCOL_CONNECTION_LOST") {
    return sendError(res, "Mất kết nối CSDL. Vui lòng thử lại.", 503);
  }

  // ── Syntax / JSON parse errors ───────────────────────────────────────
  if (err.type === "entity.parse.failed") {
    return sendError(res, "Định dạng JSON không hợp lệ.", 400);
  }

  // ── Generic fallback ────────────────────────────────────────────────
  const statusCode = err.statusCode || err.status || 500;
  const message =
    process.env.NODE_ENV === "production" && statusCode === 500
      ? "Hệ thống đang gặp sự cố. Vui lòng thử lại sau."
      : err.message || "Lỗi máy chủ nội bộ.";

  return sendError(res, message, statusCode);
};

/**
 * 404 Not Found handler.
 * Must be registered AFTER all valid routes and BEFORE errorHandler.
 */
const notFound = (req, res, next) => {
  return sendError(
    res,
    `Không tìm thấy API: ${req.method} ${req.originalUrl}`,
    404,
  );
};

module.exports = { errorHandler, notFound };

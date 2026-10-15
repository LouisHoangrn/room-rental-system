/**
 * Response Utility Helpers
 *
 * Provides a consistent JSON response format across the entire API.
 * Every response follows the shape:
 * {
 *   success: boolean,
 *   message: string,
 *   data: any | null,
 *   errors: any | null,
 *   pagination?: { page, limit, total, totalPages }
 * }
 */

/**
 * Send a success response.
 *
 * @param {import('express').Response} res - Express response object
 * @param {*} data - Response payload (default: null)
 * @param {string} message - Human-readable success message
 * @param {number} statusCode - HTTP status code (default: 200)
 */
const sendSuccess = (
  res,
  data = null,
  message = "Success",
  statusCode = 200,
) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
    errors: null,
  });
};

/**
 * Send an error response.
 *
 * @param {import('express').Response} res - Express response object
 * @param {string} message - Human-readable error message
 * @param {number} statusCode - HTTP status code (default: 500)
 * @param {*} errors - Detailed error info (validation errors, etc.)
 */
const sendError = (
  res,
  message = "Internal Server Error",
  statusCode = 500,
  errors = null,
) => {
  return res.status(statusCode).json({
    success: false,
    message,
    data: null,
    errors,
  });
};

/**
 * Send a paginated success response.
 *
 * @param {import('express').Response} res - Express response object
 * @param {Array} data - Array of records for the current page
 * @param {number} page - Current page number (1-based)
 * @param {number} limit - Number of records per page
 * @param {number} total - Total number of records across all pages
 * @param {string} message - Human-readable success message
 */
const sendPaginated = (res, data, page, limit, total, message = "Success") => {
  const totalPages = Math.ceil(total / limit);

  return res.status(200).json({
    success: true,
    message,
    data,
    errors: null,
    pagination: {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      total: parseInt(total, 10),
      totalPages,
    },
  });
};

module.exports = { sendSuccess, sendError, sendPaginated };

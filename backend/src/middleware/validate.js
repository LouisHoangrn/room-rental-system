/**
 * Validation Middleware
 *
 * Runs express-validator's validationResult against the request.
 * If validation errors exist, responds immediately with a 422 status
 * and the errors in the standard response format.
 * If no errors, passes control to the next handler.
 */

const { validationResult } = require("express-validator");
const { sendError } = require("../utils/response");

/**
 * Express middleware that checks for validation errors.
 * Place this AFTER your express-validator check chains in the route definition.
 *
 * Usage:
 *   router.post('/register',
 *     [body('email').isEmail(), body('password').isLength({ min: 6 })],
 *     validate,
 *     authController.register
 *   );
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    // Map errors to a cleaner format
    const formattedErrors = errors.array().map((err) => ({
      field: err.path,
      message: err.msg,
      value: err.value,
    }));

    return sendError(res, "Validation failed.", 422, formattedErrors);
  }

  next();
};

module.exports = { validate };

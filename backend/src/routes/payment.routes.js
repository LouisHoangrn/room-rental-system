const express = require("express");
const router = express.Router();
const paymentController = require("../controllers/payment.controller");
const { authenticate, authorize } = require("../middleware/auth");
const { validate } = require("../middleware/validate");
const { body } = require("express-validator");

const createPaymentValidation = [
  body("contract_id").isInt().withMessage("ID hợp đồng là bắt buộc"),
  body("billing_month")
    .isISO8601()
    .withMessage("Tháng thanh toán không hợp lệ"),
  body("amount").isFloat({ min: 0 }).withMessage("Số tiền phải là số dương"),
  body("due_date").optional().isISO8601().withMessage("Ngày hạn không hợp lệ"),
  body("payment_type")
    .isIn(["DEPOSIT", "MONTHLY_RENT", "OTHER"])
    .withMessage("Loại thanh toán không hợp lệ"),
];

// Owner routes
router.post(
  "/",
  authenticate,
  authorize("OWNER"),
  createPaymentValidation,
  validate,
  paymentController.createPayment,
);
router.get(
  "/owner/my-payments",
  authenticate,
  authorize("OWNER"),
  paymentController.getOwnerPayments,
);
router.get(
  "/owner/revenue",
  authenticate,
  authorize("OWNER"),
  paymentController.getOwnerRevenue,
);

// User/Tenant routes
router.get(
  "/user/my-payments",
  authenticate,
  authorize("USER"),
  paymentController.getUserPayments,
);
router.put(
  "/:id/pay",
  authenticate,
  authorize("USER"),
  paymentController.makePayment,
);

// Shared
router.get("/:id", authenticate, paymentController.getPaymentById);

module.exports = router;

const express = require("express");
const router = express.Router();
const rentalController = require("../controllers/rental.controller");
const { authenticate, authorize } = require("../middleware/auth");
const { validate } = require("../middleware/validate");
const { body } = require("express-validator");

const createRequestValidation = [
  body("room_id").isInt().withMessage("Room ID là bắt buộc"),
  body("note").optional().trim().isLength({ max: 1000 }),
];

// User routes
router.post(
  "/",
  authenticate,
  authorize("USER"),
  createRequestValidation,
  validate,
  rentalController.createRequest,
);
router.get(
  "/my-requests",
  authenticate,
  authorize("USER"),
  rentalController.getUserRequests,
);
router.put(
  "/:id/cancel",
  authenticate,
  authorize("USER"),
  rentalController.cancelRequest,
);

// Owner routes
router.get(
  "/owner-requests",
  authenticate,
  authorize("OWNER"),
  rentalController.getOwnerRequests,
);
router.put(
  "/:id/approve",
  authenticate,
  authorize("OWNER"),
  rentalController.approveRequest,
);
router.put(
  "/:id/reject",
  authenticate,
  authorize("OWNER"),
  rentalController.rejectRequest,
);

// Shared
router.get("/:id", authenticate, rentalController.getRequestById);

module.exports = router;

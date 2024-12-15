const express = require("express");
const router = express.Router();
const supportController = require("../controllers/support.controller");
const { authenticate, authorize } = require("../middleware/auth");
const { validate } = require("../middleware/validate");
const { body } = require("express-validator");

const createRequestValidation = [
  body("subject").optional().trim().isLength({ max: 255 }),
  body("message").trim().notEmpty().withMessage("Nội dung yêu cầu là bắt buộc"),
];

// User routes (any authenticated user can create/view their support requests)
router.post(
  "/",
  authenticate,
  createRequestValidation,
  validate,
  supportController.createRequest,
);
router.get("/my-requests", authenticate, supportController.getUserRequests);
router.get("/my-tickets", authenticate, supportController.getUserRequests);

// Admin routes
router.get(
  "/all",
  authenticate,
  authorize("ADMIN"),
  supportController.getAllRequests,
);
router.put(
  "/:id/status",
  authenticate,
  authorize("ADMIN"),
  supportController.updateStatus,
);
router.post(
  "/:id/respond",
  authenticate,
  authorize("ADMIN"),
  supportController.respondToRequest,
);

// Shared routes
router.post("/:id/messages", authenticate, supportController.createMessage);
router.get("/:id", authenticate, supportController.getRequestById);

module.exports = router;

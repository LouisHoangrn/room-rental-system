const express = require("express");
const router = express.Router();
const contractController = require("../controllers/contract.controller");
const { authenticate, authorize } = require("../middleware/auth");
const { validate } = require("../middleware/validate");
const { body } = require("express-validator");

const createContractValidation = [
  body("rental_request_id").isInt().withMessage("ID yêu cầu thuê là bắt buộc"),
  body("start_date").isISO8601().withMessage("Ngày bắt đầu không hợp lệ"),
  body("end_date").isISO8601().withMessage("Ngày kết thúc không hợp lệ"),
  body("deposit").optional().isFloat({ min: 0 }),
];

// Owner routes
router.post(
  "/",
  authenticate,
  authorize("OWNER"),
  createContractValidation,
  validate,
  contractController.createContract,
);
router.get(
  "/owner/my-contracts",
  authenticate,
  authorize("OWNER"),
  contractController.getOwnerContracts,
);
router.put(
  "/:id/terminate",
  authenticate,
  authorize("OWNER"),
  contractController.terminateContract,
);

// User/Tenant routes
router.get(
  "/user/my-contracts",
  authenticate,
  authorize("USER"),
  contractController.getUserContracts,
);
router.put(
  "/:id/sign",
  authenticate,
  authorize("USER"),
  contractController.signContract,
);
router.put(
  "/:id/cancel",
  authenticate,
  authorize("USER"),
  contractController.cancelContract,
);

// Shared routes
router.get("/:id", authenticate, contractController.getContractById);

module.exports = router;

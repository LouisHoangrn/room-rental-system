const express = require("express");
const router = express.Router();
const roommateController = require("../controllers/roommate.controller");
const { authenticate, authorize } = require("../middleware/auth");
const { validate } = require("../middleware/validate");
const { body } = require("express-validator");

// All roommate features require authentication and USER role
router.use(authenticate);
router.use(authorize("USER"));

// Tags dictionary (available to all authenticated USERs)
router.get("/tags", roommateController.getAllTags);

const profileValidation = [
  body("gender").optional().isIn(["MALE", "FEMALE", "OTHER"]),
  body("birth_date")
    .optional()
    .isISO8601()
    .withMessage("Ngày sinh không hợp lệ"),
  body("budget")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Ngân sách phải là số dương"),
  body("cleanliness")
    .isInt({ min: 1, max: 5 })
    .withMessage("Mức sạch sẽ từ 1-5"),
  body("sleep_time")
    .isIn(["EARLY", "LATE", "FLEXIBLE"])
    .withMessage("Giờ ngủ không hợp lệ"),
  body("work_schedule")
    .isIn(["DAY", "NIGHT", "FLEXIBLE"])
    .withMessage("Lịch làm việc không hợp lệ"),
  body("is_smoking").isBoolean(),
  body("has_pet").isBoolean(),
  body("bio").optional().trim(),
  body("tag_ids").optional().isArray().withMessage("tag_ids phải là mảng"),
  body("tag_ids.*")
    .optional()
    .isInt({ min: 1 })
    .withMessage("tag_id phải là số nguyên dương"),
];

router.get("/profile", roommateController.getProfile);
router.post(
  "/profile",
  profileValidation,
  validate,
  roommateController.createOrUpdateProfile,
);

router.get("/matches", roommateController.findMatches);

router.post("/requests", roommateController.sendRequest);
router.get("/requests/received", roommateController.getReceivedRequests);
router.get("/requests/sent", roommateController.getSentRequests);
router.put("/requests/:id/respond", roommateController.respondToRequest);
router.delete("/requests/:id/cancel", roommateController.cancelRequest);

module.exports = router;

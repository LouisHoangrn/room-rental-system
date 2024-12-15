const express = require("express");
const router = express.Router();
const userController = require("../controllers/user.controller");
const { authenticate } = require("../middleware/auth");
const { validate } = require("../middleware/validate");
const {
  updateProfileValidation,
  changePasswordValidation,
} = require("../validations/auth.validation");
const { uploadAvatar } = require("../middleware/upload");

// All user routes require authentication
router.use(authenticate);

router.get("/profile", userController.getProfile);
router.put(
  "/profile",
  updateProfileValidation,
  validate,
  userController.updateProfile,
);
router.put(
  "/password",
  changePasswordValidation,
  validate,
  userController.changePassword,
);
router.put(
  "/avatar",
  uploadAvatar,
  userController.updateAvatar
);

module.exports = router;

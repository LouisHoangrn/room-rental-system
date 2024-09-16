const express = require("express");
const router = express.Router();
const roomController = require("../controllers/room.controller");
const { authenticate, authorize } = require("../middleware/auth");
const { validate } = require("../middleware/validate");
const {
  createRoomValidation,
  updateRoomValidation,
} = require("../validations/room.validation");
const { uploadRoomImages } = require("../middleware/upload");

// ── Public routes ──────────────────────────────────────────────
router.get("/", roomController.getRooms);
router.get("/cities", roomController.getCities);
router.get("/districts", roomController.getDistricts);

// ── Owner routes (must come BEFORE /:id to avoid param capture) ──
router.get(
  "/owner/my-rooms",
  authenticate,
  authorize("OWNER"),
  roomController.getOwnerRooms,
);
router.post(
  "/",
  authenticate,
  authorize("OWNER"),
  createRoomValidation,
  validate,
  roomController.createRoom,
);
router.delete(
  "/images/:imageId",
  authenticate,
  authorize("OWNER"),
  roomController.deleteImage,
);

// ── Wildcard param routes (AFTER all specific paths) ──────────
router.get("/:id", roomController.getRoomById);
router.put(
  "/:id",
  authenticate,
  authorize("OWNER"),
  updateRoomValidation,
  validate,
  roomController.updateRoom,
);
router.delete(
  "/:id",
  authenticate,
  authorize("OWNER"),
  roomController.deleteRoom,
);
router.post(
  "/:id/images",
  authenticate,
  authorize("OWNER"),
  uploadRoomImages,
  roomController.uploadImages,
);

module.exports = router;

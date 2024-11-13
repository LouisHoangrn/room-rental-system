const express = require("express");
const router = express.Router();
const adminController = require("../controllers/admin.controller");
const { authenticate, authorize } = require("../middleware/auth");

// All admin routes require authentication and ADMIN role
router.use(authenticate);
router.use(authorize("ADMIN"));

// Dashboard
router.get("/stats", adminController.getDashboardStats);
router.get("/dashboard", adminController.getDashboardStats); // alias

// Users management
router.get("/users", adminController.getAllUsers);
router.get("/users/:id", adminController.getUserById);
router.put("/users/:id/block", adminController.blockUser);
router.put("/users/:id/unblock", adminController.unblockUser);
router.put("/users/:id/toggle-status", adminController.toggleUserStatus);

// Rooms moderation
router.get("/rooms", adminController.getAllRooms);
router.put("/rooms/:id/approve", adminController.approveRoom);
router.put("/rooms/:id/reject", adminController.rejectRoom);

// Support requests
router.get("/support", adminController.getAllSupportRequests);
router.get("/support/:id", adminController.getSupportRequestById);
router.post("/support/:id/respond", adminController.respondToSupport);
router.put("/support/:id/status", adminController.updateSupportStatus);

module.exports = router;

const adminService = require("../services/admin.service");
const { sendSuccess, sendError, sendPaginated } = require("../utils/response");

class AdminController {
  /**
   * GET /api/admin/stats
   */
  async getDashboardStats(req, res, next) {
    try {
      const stats = await adminService.getDashboardStats();
      sendSuccess(res, stats);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/admin/users
   */
  async getAllUsers(req, res, next) {
    try {
      const { page = 1, limit = 10, role, search, status } = req.query;
      const result = await adminService.getAllUsers(
        page,
        limit,
        role,
        search,
        status,
      );
      sendPaginated(res, result.users, result.page, result.limit, result.total);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/admin/users/:id
   */
  async getUserById(req, res, next) {
    try {
      const user = await adminService.getUserById(req.params.id);
      sendSuccess(res, user);
    } catch (error) {
      if (error.statusCode)
        return sendError(res, error.message, error.statusCode);
      next(error);
    }
  }

  /**
   * PUT /api/admin/users/:id/block
   */
  async blockUser(req, res, next) {
    try {
      const result = await adminService.blockUser(req.params.id);
      sendSuccess(res, result, "Đã khóa tài khoản");
    } catch (error) {
      if (error.statusCode)
        return sendError(res, error.message, error.statusCode);
      next(error);
    }
  }

  /**
   * PUT /api/admin/users/:id/unblock
   */
  async unblockUser(req, res, next) {
    try {
      const result = await adminService.unblockUser(req.params.id);
      sendSuccess(res, result, "Đã mở khóa tài khoản");
    } catch (error) {
      if (error.statusCode)
        return sendError(res, error.message, error.statusCode);
      next(error);
    }
  }

  /**
   * PUT /api/admin/users/:id/toggle-status
   */
  async toggleUserStatus(req, res, next) {
    try {
      const result = await adminService.toggleUserStatus(req.params.id);
      sendSuccess(res, result);
    } catch (error) {
      if (error.statusCode)
        return sendError(res, error.message, error.statusCode);
      next(error);
    }
  }

  /**
   * GET /api/admin/rooms
   */
  async getAllRooms(req, res, next) {
    try {
      const { page = 1, limit = 10, status } = req.query;
      const result = await adminService.getAllRooms(page, limit, status);
      sendPaginated(res, result.rooms, result.page, result.limit, result.total);
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/admin/rooms/:id/approve
   */
  async approveRoom(req, res, next) {
    try {
      const result = await adminService.approveRoom(req.params.id);
      sendSuccess(res, result, "Phòng đã được duyệt");
    } catch (error) {
      if (error.statusCode)
        return sendError(res, error.message, error.statusCode);
      next(error);
    }
  }

  /**
   * PUT /api/admin/rooms/:id/reject
   */
  async rejectRoom(req, res, next) {
    try {
      const { reject_reason } = req.body;
      const result = await adminService.rejectRoom(
        req.params.id,
        reject_reason,
      );
      sendSuccess(res, result, "Phòng đã bị từ chối");
    } catch (error) {
      if (error.statusCode)
        return sendError(res, error.message, error.statusCode);
      next(error);
    }
  }

  // ═══════════════════ SUPPORT ═══════════════════

  /**
   * GET /api/admin/support
   */
  async getAllSupportRequests(req, res, next) {
    try {
      const { page = 1, limit = 10, status } = req.query;
      const result = await adminService.getAllSupportRequests(
        page,
        limit,
        status,
      );
      sendPaginated(
        res,
        result.requests,
        result.page,
        result.limit,
        result.total,
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/admin/support/:id
   */
  async getSupportRequestById(req, res, next) {
    try {
      const request = await adminService.getSupportRequestById(req.params.id);
      sendSuccess(res, request);
    } catch (error) {
      if (error.statusCode)
        return sendError(res, error.message, error.statusCode);
      next(error);
    }
  }

  /**
   * POST /api/admin/support/:id/respond
   */
  async respondToSupport(req, res, next) {
    try {
      const { response } = req.body;
      if (!response)
        return sendError(res, "Nội dung phản hồi là bắt buộc", 400);
      const result = await adminService.respondToSupport(
        req.params.id,
        req.user.id,
        response,
      );
      sendSuccess(res, result, "Phản hồi thành công");
    } catch (error) {
      if (error.statusCode)
        return sendError(res, error.message, error.statusCode);
      next(error);
    }
  }

  /**
   * PUT /api/admin/support/:id/status
   */
  async updateSupportStatus(req, res, next) {
    try {
      const { status } = req.body;
      if (!status) return sendError(res, "Trạng thái là bắt buộc", 400);
      const result = await adminService.updateSupportStatus(
        req.params.id,
        status,
      );
      sendSuccess(res, result, "Cập nhật trạng thái thành công");
    } catch (error) {
      if (error.statusCode)
        return sendError(res, error.message, error.statusCode);
      next(error);
    }
  }
}

module.exports = new AdminController();

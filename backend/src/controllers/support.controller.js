const supportService = require("../services/support.service");
const { sendSuccess, sendError, sendPaginated } = require("../utils/response");

class SupportController {
  /**
   * POST /api/support — Create a support request
   */
  async createRequest(req, res, next) {
    try {
      const request = await supportService.createRequest(req.user.id, req.body);
      sendSuccess(res, request, "Gửi yêu cầu hỗ trợ thành công", 201);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/support/my-requests — User's support requests
   */
  async getUserRequests(req, res, next) {
    try {
      const { page = 1, limit = 10 } = req.query;
      const result = await supportService.getUserRequests(
        req.user.id,
        page,
        limit,
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
   * GET /api/support/all — Admin: all support requests
   */
  async getAllRequests(req, res, next) {
    try {
      const { page = 1, limit = 10, status } = req.query;
      const result = await supportService.getAllRequests(page, limit, status);
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
   * POST /api/support/:id/messages — Add a message to a support thread
   */
  async createMessage(req, res, next) {
    try {
      const { message } = req.body;
      if (!message || !message.trim())
        return sendError(res, "Nội dung tin nhắn là bắt buộc", 400);

      const result = await supportService.createMessage(
        req.params.id,
        req.user.id,
        req.user.role,
        message,
      );
      sendSuccess(res, result, "Gửi tin nhắn thành công");
    } catch (error) {
      if (error.statusCode)
        return sendError(res, error.message, error.statusCode);
      next(error);
    }
  }

  /**
   * GET /api/support/:id — Get support request detail
   */
  async getRequestById(req, res, next) {
    try {
      const isAdmin = req.user.role === "ADMIN";
      const request = await supportService.getRequestById(
        req.params.id,
        req.user.id,
        isAdmin,
      );
      sendSuccess(res, request);
    } catch (error) {
      if (error.statusCode)
        return sendError(res, error.message, error.statusCode);
      next(error);
    }
  }

  /**
   * PUT /api/support/:id/status — Admin: update status
   */
  async updateStatus(req, res, next) {
    try {
      const { status } = req.body;
      if (!status) return sendError(res, "Trạng thái là bắt buộc", 400);

      const result = await supportService.updateStatus(req.params.id, status);
      sendSuccess(res, result, "Cập nhật trạng thái thành công");
    } catch (error) {
      if (error.statusCode)
        return sendError(res, error.message, error.statusCode);
      next(error);
    }
  }

  /**
   * POST /api/support/:id/respond — Admin: respond to request
   */
  async respondToRequest(req, res, next) {
    try {
      const { response } = req.body;
      if (!response)
        return sendError(res, "Nội dung phản hồi là bắt buộc", 400);

      const result = await supportService.respondToRequest(
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
}

module.exports = new SupportController();

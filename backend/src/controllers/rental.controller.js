const rentalService = require("../services/rental.service");
const { sendSuccess, sendError, sendPaginated } = require("../utils/response");

class RentalController {
  /**
   * POST /api/rentals - Create rental request (user)
   */
  async createRequest(req, res, next) {
    try {
      const request = await rentalService.createRequest(req.user.id, req.body);
      sendSuccess(res, request, "Gửi yêu cầu thuê phòng thành công", 201);
    } catch (error) {
      if (error.statusCode)
        return sendError(res, error.message, error.statusCode);
      next(error);
    }
  }

  /**
   * GET /api/rentals/my-requests - Get user's requests
   */
  async getUserRequests(req, res, next) {
    try {
      const { page = 1, limit = 10 } = req.query;
      const result = await rentalService.getUserRequests(
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
   * GET /api/rentals/owner-requests - Get owner's requests
   */
  async getOwnerRequests(req, res, next) {
    try {
      const { status, page = 1, limit = 10 } = req.query;
      const result = await rentalService.getOwnerRequests(
        req.user.id,
        status,
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
   * GET /api/rentals/:id - Get request detail
   */
  async getRequestById(req, res, next) {
    try {
      const request = await rentalService.getRequestById(req.params.id);
      sendSuccess(res, request);
    } catch (error) {
      if (error.statusCode)
        return sendError(res, error.message, error.statusCode);
      next(error);
    }
  }

  /**
   * PUT /api/rentals/:id/approve - Approve request (owner)
   */
  async approveRequest(req, res, next) {
    try {
      const request = await rentalService.approveRequest(
        req.params.id,
        req.user.id,
      );
      sendSuccess(res, request, "Đã duyệt yêu cầu thuê phòng");
    } catch (error) {
      if (error.statusCode)
        return sendError(res, error.message, error.statusCode);
      next(error);
    }
  }

  /**
   * PUT /api/rentals/:id/reject - Reject request (owner)
   */
  async rejectRequest(req, res, next) {
    try {
      const { reject_reason } = req.body;
      const request = await rentalService.rejectRequest(
        req.params.id,
        req.user.id,
        reject_reason,
      );
      sendSuccess(res, request, "Đã từ chối yêu cầu");
    } catch (error) {
      if (error.statusCode)
        return sendError(res, error.message, error.statusCode);
      next(error);
    }
  }

  /**
   * PUT /api/rentals/:id/cancel - Cancel request (user)
   */
  async cancelRequest(req, res, next) {
    try {
      const result = await rentalService.cancelRequest(
        req.params.id,
        req.user.id,
      );
      sendSuccess(res, result, "Đã hủy yêu cầu thuê phòng");
    } catch (error) {
      if (error.statusCode)
        return sendError(res, error.message, error.statusCode);
      next(error);
    }
  }
}

module.exports = new RentalController();

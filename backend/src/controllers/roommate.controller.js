const roommateService = require("../services/roommate.service");
const { sendSuccess, sendError, sendPaginated } = require("../utils/response");

class RoommateController {
  /**
   * GET /api/roommates/tags
   */
  async getAllTags(req, res, next) {
    try {
      const tags = await roommateService.getAllTags();
      sendSuccess(res, tags);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/roommates/profile
   */
  async createOrUpdateProfile(req, res, next) {
    try {
      const profile = await roommateService.createOrUpdateProfile(
        req.user.id,
        req.body,
      );
      sendSuccess(res, profile, "Lưu hồ sơ thành công", 201);
    } catch (error) {
      if (error.statusCode)
        return sendError(res, error.message, error.statusCode);
      next(error);
    }
  }

  /**
   * GET /api/roommates/profile
   */
  async getProfile(req, res, next) {
    try {
      const profile = await roommateService.getProfile(req.user.id);
      sendSuccess(res, profile);
    } catch (error) {
      if (error.statusCode)
        return sendError(res, error.message, error.statusCode);
      next(error);
    }
  }

  /**
   * GET /api/roommates/matches
   */
  async findMatches(req, res, next) {
    try {
      const {
        page = 1,
        limit = 10,
        minScore,
        gender,
        is_smoking,
        has_pet,
      } = req.query;

      const filters = { minScore, gender, is_smoking, has_pet };
      const result = await roommateService.findMatches(
        req.user.id,
        page,
        limit,
        filters,
      );
      sendPaginated(
        res,
        result.matches,
        result.page,
        result.limit,
        result.total,
      );
    } catch (error) {
      if (error.statusCode)
        return sendError(res, error.message, error.statusCode);
      next(error);
    }
  }

  /**
   * POST /api/roommates/requests
   */
  async sendRequest(req, res, next) {
    try {
      const { receiver_id, message } = req.body;
      if (!receiver_id) return sendError(res, "ID người nhận là bắt buộc", 400);

      const request = await roommateService.sendRequest(
        req.user.id,
        receiver_id,
        message,
      );
      sendSuccess(res, request, "Gửi yêu cầu ghép đôi thành công", 201);
    } catch (error) {
      if (error.statusCode)
        return sendError(res, error.message, error.statusCode);
      next(error);
    }
  }

  /**
   * PUT /api/roommates/requests/:id/respond
   */
  async respondToRequest(req, res, next) {
    try {
      const { status } = req.body;
      const result = await roommateService.respondToRequest(
        req.params.id,
        req.user.id,
        status,
      );
      sendSuccess(res, result);
    } catch (error) {
      if (error.statusCode)
        return sendError(res, error.message, error.statusCode);
      next(error);
    }
  }

  /**
   * GET /api/roommates/requests/received
   */
  async getReceivedRequests(req, res, next) {
    try {
      const { page = 1, limit = 10 } = req.query;
      const result = await roommateService.getReceivedRequests(
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
   * GET /api/roommates/requests/sent
   */
  async getSentRequests(req, res, next) {
    try {
      const { page = 1, limit = 10 } = req.query;
      const result = await roommateService.getSentRequests(
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
   * DELETE /api/roommates/requests/:id/cancel
   */
  async cancelRequest(req, res, next) {
    try {
      const result = await roommateService.unmatchOrCancelRequest(
        req.params.id,
        req.user.id,
      );
      sendSuccess(res, result, result.message);
    } catch (error) {
      if (error.statusCode)
        return sendError(res, error.message, error.statusCode);
      next(error);
    }
  }
}

module.exports = new RoommateController();

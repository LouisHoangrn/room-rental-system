const roomService = require("../services/room.service");
const { sendSuccess, sendError, sendPaginated } = require("../utils/response");

class RoomController {
  /**
   * GET /api/rooms - Browse rooms (public)
   */
  async getRooms(req, res, next) {
    try {
      const { rooms, total, page, limit } = await roomService.getRooms(
        req.query,
      );
      sendPaginated(res, rooms, page, limit, total, "Danh sách phòng trọ");
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/rooms/cities - Get available cities
   */
  async getCities(req, res, next) {
    try {
      const cities = await roomService.getCities();
      sendSuccess(res, cities);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/rooms/districts?city=... - Get districts for a city
   */
  async getDistricts(req, res, next) {
    try {
      const { city } = req.query;
      if (!city) return sendError(res, "Vui lòng cung cấp tên thành phố", 400);
      const districts = await roomService.getDistricts(city);
      sendSuccess(res, districts);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/rooms/:id - Get room detail (public)
   */
  async getRoomById(req, res, next) {
    try {
      const room = await roomService.getRoomById(req.params.id);
      sendSuccess(res, room);
    } catch (error) {
      if (error.statusCode)
        return sendError(res, error.message, error.statusCode);
      next(error);
    }
  }

  /**
   * GET /api/rooms/owner/my-rooms - Get owner's rooms
   */
  async getOwnerRooms(req, res, next) {
    try {
      const { page = 1, limit = 10 } = req.query;
      const result = await roomService.getOwnerRooms(req.user.id, page, limit);
      sendPaginated(res, result.rooms, result.page, result.limit, result.total);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/rooms - Create room (owner)
   */
  async createRoom(req, res, next) {
    try {
      const room = await roomService.createRoom(req.user.id, req.body);
      sendSuccess(res, room, "Tạo phòng thành công. Chờ Admin duyệt.", 201);
    } catch (error) {
      if (error.statusCode)
        return sendError(res, error.message, error.statusCode);
      next(error);
    }
  }

  /**
   * PUT /api/rooms/:id - Update room (owner)
   */
  async updateRoom(req, res, next) {
    try {
      const room = await roomService.updateRoom(
        req.params.id,
        req.user.id,
        req.body,
      );
      sendSuccess(res, room, "Cập nhật phòng thành công");
    } catch (error) {
      if (error.statusCode)
        return sendError(res, error.message, error.statusCode);
      next(error);
    }
  }

  /**
   * DELETE /api/rooms/:id - Delete room (owner)
   */
  async deleteRoom(req, res, next) {
    try {
      await roomService.deleteRoom(req.params.id, req.user.id);
      sendSuccess(res, null, "Xóa phòng thành công");
    } catch (error) {
      if (error.statusCode)
        return sendError(res, error.message, error.statusCode);
      next(error);
    }
  }

  /**
   * POST /api/rooms/:id/images - Upload images (owner)
   */
  async uploadImages(req, res, next) {
    try {
      const images = await roomService.uploadImages(
        req.params.id,
        req.user.id,
        req.files,
      );
      sendSuccess(res, images, "Tải ảnh thành công");
    } catch (error) {
      if (error.statusCode)
        return sendError(res, error.message, error.statusCode);
      next(error);
    }
  }

  /**
   * DELETE /api/rooms/images/:imageId - Delete image (owner)
   */
  async deleteImage(req, res, next) {
    try {
      await roomService.deleteImage(req.params.imageId, req.user.id);
      sendSuccess(res, null, "Xóa ảnh thành công");
    } catch (error) {
      if (error.statusCode)
        return sendError(res, error.message, error.statusCode);
      next(error);
    }
  }
}

module.exports = new RoomController();

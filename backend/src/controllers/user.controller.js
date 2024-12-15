const userService = require("../services/user.service");
const { sendSuccess, sendError } = require("../utils/response");

class UserController {
  /**
   * GET /api/users/profile
   */
  async getProfile(req, res, next) {
    try {
      const user = await userService.getUserById(req.user.id);
      sendSuccess(res, user);
    } catch (error) {
      if (error.statusCode)
        return sendError(res, error.message, error.statusCode);
      next(error);
    }
  }

  /**
   * PUT /api/users/profile
   */
  async updateProfile(req, res, next) {
    try {
      const user = await userService.updateProfile(req.user.id, req.body);
      sendSuccess(res, user, "Cập nhật hồ sơ thành công");
    } catch (error) {
      if (error.statusCode)
        return sendError(res, error.message, error.statusCode);
      next(error);
    }
  }
  /**
   * PUT /api/users/password
   */
  async changePassword(req, res, next) {
    try {
      const { oldPassword, newPassword } = req.body;
      const result = await userService.changePassword(
        req.user.id,
        oldPassword,
        newPassword,
      );
      sendSuccess(res, result, "Đổi mật khẩu thành công");
    } catch (error) {
      if (error.statusCode)
        return sendError(res, error.message, error.statusCode);
      next(error);
    }
  }

  /**
   * PUT /api/users/avatar
   */
  async updateAvatar(req, res, next) {
    try {
      if (!req.file) {
        return sendError(res, "Vui lòng chọn ảnh", 400);
      }
      // avatar is uploaded to src/uploads/avatars, but the public URL format should match rooms
      // Since express.static is serving src/uploads as /uploads or similar, let's see how rooms are stored
      // Usually it's just the relative path or filename
      const avatarUrl = `/uploads/avatars/${req.file.filename}`;
      const result = await userService.updateAvatar(req.user.id, avatarUrl);
      sendSuccess(res, result, "Cập nhật ảnh đại diện thành công");
    } catch (error) {
      if (error.statusCode)
        return sendError(res, error.message, error.statusCode);
      next(error);
    }
  }
}

module.exports = new UserController();

const paymentService = require("../services/payment.service");
const { sendSuccess, sendError, sendPaginated } = require("../utils/response");

class PaymentController {
  /**
   * POST /api/payments - Create payment/invoice (owner)
   */
  async createPayment(req, res, next) {
    try {
      const payment = await paymentService.createPayment(req.user.id, req.body);
      sendSuccess(res, payment, "Tạo hóa đơn thành công", 201);
    } catch (error) {
      if (error.statusCode)
        return sendError(res, error.message, error.statusCode);
      next(error);
    }
  }

  /**
   * PUT /api/payments/:id/pay - Simulate payment (user/tenant)
   */
  async makePayment(req, res, next) {
    try {
      const payment = await paymentService.makePayment(
        req.params.id,
        req.user.id,
      );
      sendSuccess(res, payment, "Thanh toán thành công");
    } catch (error) {
      if (error.statusCode)
        return sendError(res, error.message, error.statusCode);
      next(error);
    }
  }

  /**
   * GET /api/payments/user/my-payments - User's payments
   */
  async getUserPayments(req, res, next) {
    try {
      const { page = 1, limit = 10, status } = req.query;
      const result = await paymentService.getUserPayments(
        req.user.id,
        page,
        limit,
        status,
      );
      sendPaginated(
        res,
        result.payments,
        result.page,
        result.limit,
        result.total,
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/payments/owner/my-payments - Owner's payments
   */
  async getOwnerPayments(req, res, next) {
    try {
      const { page = 1, limit = 10, status } = req.query;
      const result = await paymentService.getOwnerPayments(
        req.user.id,
        page,
        limit,
        status,
      );
      sendPaginated(
        res,
        result.payments,
        result.page,
        result.limit,
        result.total,
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/payments/:id - Get payment detail
   */
  async getPaymentById(req, res, next) {
    try {
      const payment = await paymentService.getPaymentById(req.params.id);
      sendSuccess(res, payment);
    } catch (error) {
      if (error.statusCode)
        return sendError(res, error.message, error.statusCode);
      next(error);
    }
  }

  /**
   * GET /api/payments/owner/revenue - Get owner's total revenue
   */
  async getOwnerRevenue(req, res, next) {
    try {
      const revenue = await paymentService.getOwnerRevenue(req.user.id);
      sendSuccess(res, { revenue });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new PaymentController();

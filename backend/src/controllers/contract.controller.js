const contractService = require("../services/contract.service");
const { sendSuccess, sendError, sendPaginated } = require("../utils/response");

class ContractController {
  /**
   * POST /api/contracts - Create contract (owner)
   */
  async createContract(req, res, next) {
    try {
      const contract = await contractService.createContract(
        req.user.id,
        req.body,
      );
      sendSuccess(res, contract, "Tạo hợp đồng thành công", 201);
    } catch (error) {
      if (error.statusCode)
        return sendError(res, error.message, error.statusCode);
      next(error);
    }
  }

  /**
   * GET /api/contracts/:id - Get contract detail
   */
  async getContractById(req, res, next) {
    try {
      const contract = await contractService.getContractById(req.params.id);
      sendSuccess(res, contract);
    } catch (error) {
      if (error.statusCode)
        return sendError(res, error.message, error.statusCode);
      next(error);
    }
  }

  /**
   * GET /api/contracts/user/my-contracts - User's contracts
   */
  async getUserContracts(req, res, next) {
    try {
      const { page = 1, limit = 10 } = req.query;
      const result = await contractService.getUserContracts(
        req.user.id,
        page,
        limit,
      );
      sendPaginated(
        res,
        result.contracts,
        result.page,
        result.limit,
        result.total,
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/contracts/owner/my-contracts - Owner's contracts
   */
  async getOwnerContracts(req, res, next) {
    try {
      const { page = 1, limit = 10 } = req.query;
      const result = await contractService.getOwnerContracts(
        req.user.id,
        page,
        limit,
      );
      sendPaginated(
        res,
        result.contracts,
        result.page,
        result.limit,
        result.total,
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/contracts/:id/sign - Sign contract (user)
   */
  async signContract(req, res, next) {
    try {
      const contract = await contractService.signContract(
        req.params.id,
        req.user.id,
      );
      sendSuccess(res, contract, "Ký hợp đồng thành công");
    } catch (error) {
      if (error.statusCode)
        return sendError(res, error.message, error.statusCode);
      next(error);
    }
  }

  /**
   * PUT /api/contracts/:id/cancel - Cancel/refuse contract (user)
   */
  async cancelContract(req, res, next) {
    try {
      const contract = await contractService.cancelContract(
        req.params.id,
        req.user.id,
      );
      sendSuccess(res, contract, "Đã từ chối hợp đồng");
    } catch (error) {
      if (error.statusCode)
        return sendError(res, error.message, error.statusCode);
      next(error);
    }
  }
  /**
   * PUT /api/contracts/:id/terminate - Terminate contract (owner)
   */
  async terminateContract(req, res, next) {
    try {
      const contract = await contractService.terminateContract(
        req.params.id,
        req.user.id,
      );
      sendSuccess(res, contract, "Đã chấm dứt hợp đồng");
    } catch (error) {
      if (error.statusCode)
        return sendError(res, error.message, error.statusCode);
      next(error);
    }
  }
}

module.exports = new ContractController();

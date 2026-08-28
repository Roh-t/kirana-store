import { InventoryService } from './inventory.service.js';
import { InventoryValidator } from './inventory.validator.js';
import { ApiResponse } from '../../utils/apiResponse.js';

export class InventoryController {
  static async getInventory(req, res, next) {
    try {
      const inventory = await InventoryService.getInventoryByStore(req.storeId, req.query);

      return ApiResponse.success(res, {
        statusCode: 200,
        message: 'Inventory balances retrieved successfully',
        data: inventory
      });
    } catch (error) {
      next(error);
    }
  }

  static async adjustStock(req, res, next) {
    try {
      const validatedData = InventoryValidator.validateStockAdjustment(req.body);
      const result = await InventoryService.adjustStock(req.storeId, req.user._id, validatedData);

      return ApiResponse.success(res, {
        statusCode: 200,
        message: 'Stock updated successfully',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  static async getTransactions(req, res, next) {
    try {
      const { productId } = req.params;
      const transactions = await InventoryService.getTransactions(req.storeId, productId, req.query.limit);

      return ApiResponse.success(res, {
        statusCode: 200,
        message: 'Stock movement transactions retrieved',
        data: transactions
      });
    } catch (error) {
      next(error);
    }
  }
}
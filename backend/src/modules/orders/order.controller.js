import { OrderService } from './order.service.js';
import { OrderValidator } from './order.validator.js';
import { ApiResponse } from '../../utils/apiResponse.js';

export class OrderController {
  static async createPublicOrder(req, res, next) {
    try {
      const validatedData = OrderValidator.validateCreateOrder(req.body);
      const order = await OrderService.createPublicOrder(req.params.slug, validatedData);

      return ApiResponse.success(res, {
        statusCode: 201,
        message: 'Order placed successfully',
        data: order
      });
    } catch (error) {
      next(error);
    }
  }

  static async getOrderQueue(req, res, next) {
    try {
      const { orders, statusSummary, pagination } = await OrderService.getStoreOrderQueue(req.storeId, req.query);

      return ApiResponse.paginated(res, {
        statusCode: 200,
        message: 'Order queue retrieved successfully',
        data: orders,
        pagination,
        meta: { statusSummary }
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateOrderStatus(req, res, next) {
    try {
      const { status, cancellationReason } = req.body;
      const updatedOrder = await OrderService.updateOrderStatus(
        req.storeId,
        req.user._id,
        req.params.id,
        status,
        cancellationReason
      );

      return ApiResponse.success(res, {
        statusCode: 200,
        message: `Order status updated to ${status}`,
        data: updatedOrder
      });
    } catch (error) {
      next(error);
    }
  }

  static async getOrderById(req, res, next) {
    try {
      const order = await OrderService.getOrderById(req.params.id);

      return ApiResponse.success(res, {
        statusCode: 200,
        message: 'Order details retrieved',
        data: order
      });
    } catch (error) {
      next(error);
    }
  }
}
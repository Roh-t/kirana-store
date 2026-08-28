import { CustomerService } from './customer.service.js';
import { CustomerValidator } from './customer.validator.js';
import { ApiResponse } from '../../utils/apiResponse.js';

export class CustomerController {
  static async createCustomer(req, res, next) {
    try {
      const validatedData = CustomerValidator.validateCreateCustomer(req.body);
      const customer = await CustomerService.createCustomer(req.storeId, validatedData);

      return ApiResponse.success(res, {
        statusCode: 201,
        message: 'Customer profile created',
        data: customer
      });
    } catch (error) {
      next(error);
    }
  }

  static async getCustomers(req, res, next) {
    try {
      const { customers, totalUdharBalance, pagination } = await CustomerService.getCustomersByStore(
        req.storeId,
        req.query
      );

      return ApiResponse.paginated(res, {
        statusCode: 200,
        message: 'Customers retrieved successfully',
        data: customers,
        pagination,
        meta: { totalUdharBalance }
      });
    } catch (error) {
      next(error);
    }
  }

  static async getCustomerById(req, res, next) {
    try {
      const customer = await CustomerService.getCustomerById(req.storeId, req.params.id);

      return ApiResponse.success(res, {
        statusCode: 200,
        message: 'Customer profile retrieved',
        data: customer
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateUdhar(req, res, next) {
    try {
      const { amountDelta, notes } = CustomerValidator.validateUdharAdjustment(req.body);
      const updated = await CustomerService.updateUdharBalance(req.storeId, req.params.id, amountDelta, notes);

      return ApiResponse.success(res, {
        statusCode: 200,
        message: 'Udhar ledger balance updated',
        data: updated
      });
    } catch (error) {
      next(error);
    }
  }
}
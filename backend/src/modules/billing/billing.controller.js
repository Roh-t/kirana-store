import { BillingService } from './billing.service.js';
import { BillingValidator } from './billing.validator.js';
import { ApiResponse } from '../../utils/apiResponse.js';

export class BillingController {
  static async generateInvoice(req, res, next) {
    try {
      const validatedData = BillingValidator.validateGenerateInvoice(req.body);
      const result = await BillingService.generateInvoiceForOrder(req.storeId, req.user._id, validatedData);

      return ApiResponse.success(res, {
        statusCode: 201,
        message: 'Tax invoice generated successfully',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  static async getInvoices(req, res, next) {
    try {
      const invoices = await BillingService.getInvoicesByStore(req.storeId, req.query.limit);

      return ApiResponse.success(res, {
        statusCode: 200,
        message: 'Invoices retrieved successfully',
        data: invoices
      });
    } catch (error) {
      next(error);
    }
  }

  static async getInvoiceById(req, res, next) {
    try {
      const invoiceData = await BillingService.getInvoiceById(req.storeId, req.params.id);

      return ApiResponse.success(res, {
        statusCode: 200,
        message: 'Invoice details retrieved',
        data: invoiceData
      });
    } catch (error) {
      next(error);
    }
  }
}
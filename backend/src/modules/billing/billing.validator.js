import { ApiError } from '../../utils/apiError.js';

export class BillingValidator {
  static validateGenerateInvoice(data) {
    const errors = [];

    if (!data.orderId) {
      errors.push({ field: 'orderId', message: 'Order ID is required' });
    }

    const validMethods = ['CASH', 'UPI', 'CARD', 'UDHAR', 'MIXED'];
    if (!data.paymentMethod || !validMethods.includes(data.paymentMethod.toUpperCase())) {
      errors.push({ field: 'paymentMethod', message: `Payment method must be one of: ${validMethods.join(', ')}` });
    }

    if (data.paidAmount !== undefined && (typeof data.paidAmount !== 'number' || data.paidAmount < 0)) {
      errors.push({ field: 'paidAmount', message: 'Paid amount must be a positive number' });
    }

    if (errors.length > 0) {
      throw ApiError.badRequest('Validation failed', errors);
    }

    return {
      orderId: data.orderId,
      paymentMethod: data.paymentMethod.toUpperCase(),
      paidAmount: data.paidAmount !== undefined ? Number(data.paidAmount) : null
    };
  }
}
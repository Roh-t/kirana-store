import { ApiError } from '../../utils/apiError.js';

export class PaymentValidator {
  static validateRecordPayment(data) {
    const errors = [];

    if (!data.orderId) {
      errors.push({ field: 'orderId', message: 'Order ID is required' });
    }

    if (data.amount === undefined || typeof data.amount !== 'number' || data.amount <= 0) {
      errors.push({ field: 'amount', message: 'Valid payment amount > 0 is required' });
    }

    const validMethods = ['CASH', 'UPI', 'CARD', 'ONLINE', 'UDHAR', 'OTHER'];
    if (!data.method || !validMethods.includes(data.method.toUpperCase())) {
      errors.push({ field: 'method', message: `Method must be one of: ${validMethods.join(', ')}` });
    }

    if (errors.length > 0) {
      throw ApiError.badRequest('Validation failed', errors);
    }

    return {
      orderId: data.orderId,
      amount: Number(data.amount),
      method: data.method.toUpperCase(),
      transactionId: data.transactionId ? data.transactionId.trim() : null
    };
  }
}
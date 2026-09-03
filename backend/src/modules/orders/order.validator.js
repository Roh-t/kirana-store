import { ApiError } from '../../utils/apiError.js';

export class OrderValidator {
  static normalizePhone(phone) {
    if (!phone) return '';
    let cleaned = phone.toString().replace(/\D/g, '');
    if (cleaned.length === 10) return `+91${cleaned}`;
    if (cleaned.length === 12 && cleaned.startsWith('91')) return `+${cleaned}`;
    return phone.trim();
  }

  static validateCreateOrder(data) {
    const errors = [];

    const validTypes = ['PICKUP', 'STORE_COUNTER', 'DELIVERY'];
    if (!data.orderType || !validTypes.includes(data.orderType.toUpperCase())) {
      errors.push({ field: 'orderType', message: `Order type must be one of: ${validTypes.join(', ')}` });
    }

    if (!data.customerDetails || typeof data.customerDetails !== 'object') {
      errors.push({ field: 'customerDetails', message: 'Customer details are required' });
    } else {
      if (!data.customerDetails.name || data.customerDetails.name.trim().length < 2) {
        errors.push({ field: 'customerDetails.name', message: 'Customer full name is required' });
      }

      const normalizedPhone = this.normalizePhone(data.customerDetails.phone);
      if (!/^\+91[6-9]\d{9}$/.test(normalizedPhone)) {
        errors.push({ field: 'customerDetails.phone', message: 'Valid 10-digit Indian mobile number required' });
      }
      data.customerDetails.phone = normalizedPhone;

      if (data.orderType === 'DELIVERY' && (!data.customerDetails.deliveryAddress || data.customerDetails.deliveryAddress.trim().length < 5)) {
        errors.push({ field: 'customerDetails.deliveryAddress', message: 'Delivery address is required for home delivery' });
      }
    }

    if (!Array.isArray(data.items) || data.items.length === 0) {
      errors.push({ field: 'items', message: 'Order must contain at least one item' });
    } else {
      data.items.forEach((item, index) => {
        if (!item.productId) {
          errors.push({ field: `items[${index}].productId`, message: 'Product ID is required' });
        }
        if (typeof item.quantity !== 'number' || !Number.isFinite(item.quantity) || item.quantity <= 0) {
          errors.push({ field: `items[${index}].quantity`, message: 'Valid quantity > 0 is required' });
        }
      });
    }

    if (errors.length > 0) {
      throw ApiError.badRequest('Validation failed', errors);
    }

    return {
      orderType: data.orderType.toUpperCase(),
      customerDetails: {
        name: data.customerDetails.name.trim(),
        phone: data.customerDetails.phone,
        deliveryAddress: data.customerDetails.deliveryAddress ? data.customerDetails.deliveryAddress.trim() : null
      },
      items: data.items,
      notes: data.notes ? data.notes.trim() : null
    };
  }
}
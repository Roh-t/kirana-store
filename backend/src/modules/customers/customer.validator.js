import { ApiError } from '../../utils/apiError.js';

export class CustomerValidator {
  static normalizePhone(phone) {
    if (!phone) return '';
    let cleaned = phone.toString().replace(/\D/g, '');
    if (cleaned.length === 10) return `+91${cleaned}`;
    if (cleaned.length === 12 && cleaned.startsWith('91')) return `+${cleaned}`;
    return phone.trim();
  }

  static validateCreateCustomer(data) {
    const errors = [];
    const normalizedPhone = this.normalizePhone(data.phone);

    if (!/^\+91[6-9]\d{9}$/.test(normalizedPhone)) {
      errors.push({ field: 'phone', message: 'Please provide a valid 10-digit Indian mobile number' });
    }

    if (errors.length > 0) {
      throw ApiError.badRequest('Validation failed', errors);
    }

    return {
      phone: normalizedPhone,
      name: data.name ? data.name.trim() : 'Guest Customer',
      email: data.email ? data.email.trim().toLowerCase() : null,
      address: data.address || {},
      udharBalance: data.udharBalance ? Number(data.udharBalance) : 0,
      isGuest: Boolean(data.isGuest)
    };
  }

  static validateUdharAdjustment(data) {
    if (data.amountDelta === undefined || typeof data.amountDelta !== 'number' || data.amountDelta === 0) {
      throw ApiError.badRequest('Validation failed', [{ field: 'amountDelta', message: 'Valid non-zero amount delta required' }]);
    }
    return {
      amountDelta: Number(data.amountDelta),
      notes: data.notes ? data.notes.trim() : null
    };
  }
}
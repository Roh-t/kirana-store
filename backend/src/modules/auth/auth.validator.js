import { ApiError } from '../../utils/apiError.js';

export class AuthValidator {
  static normalizePhone(phone) {
    if (!phone) return '';
    let cleaned = phone.toString().replace(/\D/g, '');
    if (cleaned.length === 10) {
      return `+91${cleaned}`;
    }
    if (cleaned.length === 12 && cleaned.startsWith('91')) {
      return `+${cleaned}`;
    }
    return phone.trim();
  }

  static validateRegister(data) {
    const errors = [];
    const normalizedPhone = this.normalizePhone(data.phone);

    if (!data.name || data.name.trim().length < 2) {
      errors.push({ field: 'name', message: 'Name must be at least 2 characters long' });
    }

    if (!/^\+91[6-9]\d{9}$/.test(normalizedPhone)) {
      errors.push({ field: 'phone', message: 'Please provide a valid 10-digit Indian mobile number' });
    }

    if (!data.password || data.password.length < 6) {
      errors.push({ field: 'password', message: 'Password must be at least 6 characters long' });
    }

    if (data.email && !/^\S+@\S+\.\S+$/.test(data.email)) {
      errors.push({ field: 'email', message: 'Please provide a valid email address' });
    }

    if (errors.length > 0) {
      throw ApiError.badRequest('Validation failed', errors);
    }

    return {
      ...data,
      phone: normalizedPhone
    };
  }

  static validateLogin(data) {
    const errors = [];
    const normalizedPhone = this.normalizePhone(data.phone);

    if (!/^\+91[6-9]\d{9}$/.test(normalizedPhone)) {
      errors.push({ field: 'phone', message: 'Please provide a valid 10-digit Indian mobile number' });
    }

    if (!data.password) {
      errors.push({ field: 'password', message: 'Password is required' });
    }

    if (errors.length > 0) {
      throw ApiError.badRequest('Validation failed', errors);
    }

    return {
      ...data,
      phone: normalizedPhone
    };
  }
}
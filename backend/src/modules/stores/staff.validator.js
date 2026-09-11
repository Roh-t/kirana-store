import { ApiError } from '../../utils/apiError.js';

export class StaffValidator {
  static normalizePhone(phone) {
    if (!phone) return '';
    let cleaned = phone.toString().replace(/\D/g, '');
    if (cleaned.length === 10) return `+91${cleaned}`;
    if (cleaned.length === 12 && cleaned.startsWith('91')) return `+${cleaned}`;
    return phone.trim();
  }

  static validateAddStaff(data) {
    const errors = [];
    const normalizedPhone = this.normalizePhone(data.phone);

    if (!data.name || data.name.trim().length < 2) {
      errors.push({ field: 'name', message: 'Staff name must be at least 2 characters long' });
    }

    if (!/^\+91[6-9]\d{9}$/.test(normalizedPhone)) {
      errors.push({ field: 'phone', message: 'Please provide a valid 10-digit Indian mobile number' });
    }

    const roleName = typeof data.roleName === 'string' ? data.roleName.trim() : '';
    if (roleName.length < 2 || roleName.length > 50) {
      errors.push({ field: 'roleName', message: 'Role must be between 2 and 50 characters long' });
    }

    if (errors.length > 0) {
      throw ApiError.badRequest('Validation failed', errors);
    }

    return {
      name: data.name.trim(),
      phone: normalizedPhone,
      roleName: roleName.toUpperCase()
    };
  }
}
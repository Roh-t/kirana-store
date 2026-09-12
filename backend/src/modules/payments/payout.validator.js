import { ApiError } from '../../utils/apiError.js';

export class PayoutValidator {
  static validateOnboarding(data) {
    const errors = [];

    if (!data.legalBusinessName || data.legalBusinessName.trim().length < 2) {
      errors.push({ field: 'legalBusinessName', message: 'Legal/registered business name is required' });
    }

    if (!data.beneficiaryName || data.beneficiaryName.trim().length < 2) {
      errors.push({ field: 'beneficiaryName', message: 'Bank account holder name is required' });
    }

    if (!data.email || !/^\S+@\S+\.\S+$/.test(data.email)) {
      errors.push({ field: 'email', message: 'A valid email is required for Razorpay KYC notifications' });
    }

    const cleanedPhone = (data.phone || '').toString().replace(/\D/g, '').slice(-10);
    if (!/^[6-9]\d{9}$/.test(cleanedPhone)) {
      errors.push({ field: 'phone', message: 'A valid 10-digit contact number is required' });
    }

    if (!data.accountNumber || !/^\d{9,18}$/.test(data.accountNumber)) {
      errors.push({ field: 'accountNumber', message: 'A valid bank account number is required' });
    }

    if (!data.ifsc || !/^[A-Za-z]{4}0[A-Za-z0-9]{6}$/.test(data.ifsc)) {
      errors.push({ field: 'ifsc', message: 'A valid IFSC code is required' });
    }

    if (data.pan && !/^[A-Za-z]{5}\d{4}[A-Za-z]$/.test(data.pan)) {
      errors.push({ field: 'pan', message: 'PAN format is invalid' });
    }

    if (errors.length > 0) {
      throw ApiError.badRequest('Validation failed', errors);
    }

    return {
      legalBusinessName: data.legalBusinessName.trim(),
      beneficiaryName: data.beneficiaryName.trim(),
      email: data.email.trim().toLowerCase(),
      phone: cleanedPhone,
      accountNumber: data.accountNumber.trim(),
      ifsc: data.ifsc.trim().toUpperCase(),
      pan: data.pan ? data.pan.trim().toUpperCase() : null
    };
  }
}

import { ApiError } from '../../utils/apiError.js';

export class StoreValidator {
  static validateCreateStore(data) {
    const errors = [];

    if (!data.name || data.name.trim().length < 2) {
      errors.push({ field: 'name', message: 'Store name must be at least 2 characters long' });
    }

    if (!data.phone || !/^\+91[6-9]\d{9}$/.test(data.phone.startsWith('+91') ? data.phone : `+91${data.phone}`)) {
      errors.push({ field: 'phone', message: 'Please provide a valid 10-digit Indian mobile number' });
    }

    if (!data.address || typeof data.address !== 'object') {
      errors.push({ field: 'address', message: 'Complete address details are required' });
    } else {
      if (!data.address.street || data.address.street.trim().length === 0) {
        errors.push({ field: 'address.street', message: 'Street / Shop number is required' });
      }
      if (!data.address.city || data.address.city.trim().length === 0) {
        errors.push({ field: 'address.city', message: 'City is required' });
      }
      if (!data.address.state || data.address.state.trim().length === 0) {
        errors.push({ field: 'address.state', message: 'State is required' });
      }
      if (!data.address.pincode || !/^\d{6}$/.test(data.address.pincode)) {
        errors.push({ field: 'address.pincode', message: 'Valid 6-digit Indian PIN code is required' });
      }
    }

    if (errors.length > 0) {
      throw ApiError.badRequest('Validation failed', errors);
    }

    return {
      ...data,
      phone: data.phone.startsWith('+91') ? data.phone : `+91${data.phone}`
    };
  }

  static validateUpdateStore(data) {
    if (data.phone && !/^\+91[6-9]\d{9}$/.test(data.phone.startsWith('+91') ? data.phone : `+91${data.phone}`)) {
      throw ApiError.badRequest('Validation failed', [{ field: 'phone', message: 'Invalid phone format' }]);
    }

    if (data.businessConfig) {
      const { preparationMinutes, bufferMinutes, workerCount } = data.businessConfig;
      const errors = [];
      if (preparationMinutes !== undefined && (!Number.isInteger(Number(preparationMinutes)) || Number(preparationMinutes) < 1)) {
        errors.push({ field: 'businessConfig.preparationMinutes', message: 'Preparation time must be at least 1 minute' });
      }
      if (bufferMinutes !== undefined && (!Number.isInteger(Number(bufferMinutes)) || Number(bufferMinutes) < 0)) {
        errors.push({ field: 'businessConfig.bufferMinutes', message: 'Buffer time cannot be negative' });
      }
      if (workerCount !== undefined && (!Number.isInteger(Number(workerCount)) || Number(workerCount) < 1)) {
        errors.push({ field: 'businessConfig.workerCount', message: 'Worker count must be at least 1' });
      }
      if (errors.length > 0) throw ApiError.badRequest('Validation failed', errors);

      data.businessConfig = {
        ...data.businessConfig,
        ...(preparationMinutes !== undefined && { preparationMinutes: Number(preparationMinutes) }),
        ...(bufferMinutes !== undefined && { bufferMinutes: Number(bufferMinutes) }),
        ...(workerCount !== undefined && { workerCount: Number(workerCount) })
      };
    }
    return data;
  }
}
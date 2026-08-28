import { describe, it, expect } from 'vitest';
import { AuthValidator } from '../src/modules/auth/auth.validator.js';

describe('Auth Validation & Phone Normalization', () => {
  it('should normalize 10-digit Indian phone numbers to +91 standard', () => {
    const phone1 = AuthValidator.normalizePhone('9876543210');
    expect(phone1).toBe('+919876543210');

    const phone2 = AuthValidator.normalizePhone('919876543210');
    expect(phone2).toBe('+919876543210');
  });

  it('should throw validation error if phone number is invalid', () => {
    expect(() => {
      AuthValidator.validateRegister({
        name: 'Ramesh',
        phone: '12345',
        password: 'password123'
      });
    }).toThrow();
  });

  it('should pass registration validation for valid input', () => {
    const result = AuthValidator.validateRegister({
      name: 'Ramesh Gupta',
      phone: '9876543210',
      password: 'password123'
    });

    expect(result.name).toBe('Ramesh Gupta');
    expect(result.phone).toBe('+919876543210');
  });
});
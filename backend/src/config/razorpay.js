import Razorpay from 'razorpay';
import { ApiError } from '../utils/apiError.js';

export const getRazorpayInstance = () => {
  const keyId = process.env.RAZORPAY_KEY_ID?.trim();
  const keySecret = process.env.RAZORPAY_KEY_SECRET?.trim();

  if (!keyId || !keySecret) {
    throw ApiError.serviceUnavailable(
      'Razorpay is not configured on the server. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.'
    );
  }

  return new Razorpay({
    key_id: keyId,
    key_secret: keySecret
  });
};
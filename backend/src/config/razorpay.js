import Razorpay from 'razorpay';
import { env } from './env.js';

export const getRazorpayInstance = () => {
  const keyId = process.env.RAZORPAY_KEY_ID || 'rzp_test_dummy';
  const keySecret = process.env.RAZORPAY_KEY_SECRET || 'dummy_secret';

  return new Razorpay({
    key_id: keyId,
    key_secret: keySecret
  });
};
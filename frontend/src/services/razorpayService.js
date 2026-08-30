import apiClient from './apiClient';

export const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

export const razorpayService = {
  async createSubscriptionOrder(storeId, plan = 'PRO') {
    return apiClient.post(
      '/payments/razorpay/create-subscription-order',
      { plan },
      { headers: { 'X-Store-Id': storeId } }
    );
  },

  async verifyPayment(storeId, paymentData) {
    return apiClient.post(
      '/payments/razorpay/verify-subscription-payment',
      paymentData,
      { headers: { 'X-Store-Id': storeId } }
    );
  }
};
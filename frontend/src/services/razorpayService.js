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
  },

  // Owner-side: one-time onboarding of the store's payout bank account
  async onboardPayoutAccount(storeId, kycData) {
    return apiClient.post('/payments/razorpay/payout-account', kycData, {
      headers: { 'X-Store-Id': storeId }
    });
  },

  async getPayoutAccountStatus(storeId) {
    return apiClient.get('/payments/razorpay/payout-account', {
      headers: { 'X-Store-Id': storeId }
    });
  },

  // Customer-side: pay online for a placed order (no auth, store resolved by slug)
  async createOrderPaymentIntent(slug, orderId) {
    return apiClient.post(`/public/stores/${slug}/orders/${orderId}/payment-intent`);
  },

  async verifyOrderPayment(slug, orderId, paymentData) {
    return apiClient.post(`/public/stores/${slug}/orders/${orderId}/verify-payment`, paymentData);
  }
};
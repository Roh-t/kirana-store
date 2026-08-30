import crypto from 'crypto';
import { getRazorpayInstance } from '../../config/razorpay.js';
import { Subscription } from '../subscriptions/subscription.model.js';
import { Store } from '../stores/store.model.js';
import { Payment } from './payment.model.js';
import { ApiError } from '../../utils/apiError.js';

export class RazorpayService {
  static async createSubscriptionOrder(storeId, userId, plan = 'PRO') {
    const store = await Store.findById(storeId);
    if (!store) throw ApiError.notFound('Store not found');

    const planPrices = {
      PRO: 499, // ₹499/ month
      PREMIUM: 999// ₹999/ month
    };

    const priceInRupees = planPrices[plan.toUpperCase()] || 1;
    const amountInPaise = priceInRupees * 100; // Razorpay expects amount in paise

    const razorpay = getRazorpayInstance();

    const options = {
      amount: amountInPaise,
      currency: 'INR',
      receipt: `rcpt_${storeId.toString().slice(-6)}_${Date.now().toString().slice(-6)}`,
      notes: {
        storeId: storeId.toString(),
        userId: userId.toString(),
        plan: plan.toUpperCase()
      }
    };

    const order = await razorpay.orders.create(options);

    return {
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID || 'rzp_test_dummy',
      storeName: store.name,
      plan: plan.toUpperCase()
    };
  }

  static async verifyPaymentAndActivateSubscription(storeId, userId, paymentData) {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, plan = 'PRO' } = paymentData;

    const secret = process.env.RAZORPAY_KEY_SECRET || 'dummy_secret';

    // Cryptographic HMAC-SHA256 Signature Verification
    const generatedSignature = crypto
      .createHmac('sha256', secret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (generatedSignature !== razorpay_signature) {
      throw ApiError.badRequest('Payment verification failed. Invalid HMAC signature.');
    }

    // 1. Upgrade Store Subscription
    let sub = await Subscription.findOne({ storeId });
    if (!sub) {
      sub = new Subscription({ storeId });
    }

    const planLimits = {
      PRO: { maxProducts: 1000, maxStaffUsers: 10 },
      PREMIUM: { maxProducts: -1, maxStaffUsers: -499}
    };

    const limits = planLimits[plan.toUpperCase()] || planLimits.PRO;

    const nextEndDate = new Date();
    nextEndDate.setDate(nextEndDate.getDate() + 30); // 30 Days Subscription

    sub.plan = plan.toUpperCase();
    sub.status = 'ACTIVE';
    sub.endDate = nextEndDate;
    sub.maxProducts = limits.maxProducts;
    sub.maxStaffUsers = limits.maxStaffUsers;
    sub.externalSubscriptionId = razorpay_payment_id;

    await sub.save();

    // 2. Record SaaS Payment Audit Entry
    await Payment.create({
      storeId,
      orderId: storeId, // SaaS plan payment
      paymentNumber: `PAY-SAAS-${Date.now().toString().slice(-6)}`,
      amount: plan === 'PREMIUM' ? 499: 999,
      method: 'ONLINE',
      status: 'SUCCESS',
      gateway: 'RAZORPAY',
      transactionId: razorpay_payment_id,
      gatewayResponse: { razorpay_order_id, razorpay_payment_id },
      receivedBy: userId
    });

    return {
      subscription: sub,
      paymentId: razorpay_payment_id
    };
  }

  static async handleRazorpayWebhook(rawBody, signature) {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || 'dummy_webhook_secret';

    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(rawBody)
      .digest('hex');

    if (expectedSignature !== signature) {
      throw ApiError.badRequest('Webhook signature verification failed.');
    }

    const event = JSON.parse(rawBody.toString());

    if (event.event === 'payment.captured') {
      const payment = event.payload.payment.entity;
      const storeId = payment.notes?.storeId;
      const plan = payment.notes?.plan || 'PRO';

      if (storeId) {
        let sub = await Subscription.findOne({ storeId });
        if (sub) {
          sub.status = 'ACTIVE';
          sub.plan = plan;
          const nextEnd = new Date();
          nextEnd.setDate(nextEnd.getDate() + 30);
          sub.endDate = nextEnd;
          await sub.save();
        }
      }
    }

    return { status: 'ok' };
  }
}
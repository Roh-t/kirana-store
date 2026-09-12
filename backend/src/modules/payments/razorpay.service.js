import crypto from 'crypto';
import { getRazorpayInstance } from '../../config/razorpay.js';
import { Subscription } from '../subscriptions/subscription.model.js';
import { Store } from '../stores/store.model.js';
import { Order } from '../orders/order.model.js';
import { Payment } from './payment.model.js';
import { ApiError } from '../../utils/apiError.js';

// Platform commission taken out of every online order payment before the
// remainder is auto-transferred (Razorpay Route) to the store owner's linked
// account. 0 means the owner gets 100% of the order value.
const PLATFORM_COMMISSION_PERCENT = Number(process.env.PLATFORM_COMMISSION_PERCENT || 0);

export class RazorpayService {
  /**
   * Onboards a store owner's bank account as a Razorpay Route "linked account".
   * This is a one-time KYC step. Until Razorpay activates the account (status
   * moves from PENDING to ACTIVE, usually after document verification),
   * customer online payments for this store must stay disabled.
   */
  static async createLinkedAccount(storeId, ownerUserId, kycData) {
    const store = await Store.findOne({ _id: storeId, ownerId: ownerUserId });
    if (!store) {
      throw ApiError.forbidden('Only the store owner can set up online payment payouts.');
    }

    const razorpay = getRazorpayInstance();
    const { legalBusinessName, beneficiaryName, email, phone, accountNumber, ifsc, pan } = kycData;

    const account = await razorpay.accounts.create({
      email,
      phone,
      type: 'route',
      legal_business_name: legalBusinessName,
      business_type: 'individual',
      contact_name: beneficiaryName,
      profile: {
        category: 'retail',
        subcategory: 'grocery',
        addresses: {
          registered: {
            street1: store.address.street,
            city: store.address.city,
            state: store.address.state,
            postal_code: store.address.pincode,
            country: 'IN'
          }
        }
      },
      legal_info: pan ? { pan } : undefined
    });

    // NOTE: Real Razorpay Route (v2) onboarding also requires creating a
    // "stakeholder" and configuring the "route" product with settlement bank
    // details (POST /accounts/:id/stakeholders and /accounts/:id/products)
    // before the account is submitted for activation. Those calls need
    // document uploads too, so we store the bank details here and finish
    // linking them via those APIs (or the Razorpay Dashboard) as a follow-up
    // step outside this single request/response cycle.
    try {
      const stakeholder = await razorpay.accounts.requestStakeholder?.(account.id, {
        name: beneficiaryName,
        email,
        kyc: pan ? { pan } : undefined
      });
      if (stakeholder) {
        await razorpay.accounts.requestProductConfiguration?.(account.id, {
          product_name: 'route',
          tnc_accepted: true,
          settlements: { account_number: accountNumber, ifsc_code: ifsc, beneficiary_name: beneficiaryName }
        });
      }
    } catch (_err) {
      // Non-fatal here: these follow-up calls can also be completed from the
      // Razorpay Dashboard before the account activates; we don't block
      // returning the PENDING status to the owner.
    }

    store.payoutAccount = {
      razorpayAccountId: account.id,
      status: 'PENDING',
      legalBusinessName,
      beneficiaryName,
      bankAccountLast4: accountNumber ? accountNumber.slice(-4) : null,
      ifsc,
      onboardedAt: new Date()
    };
    await store.save();

    return store.payoutAccount;
  }

  /** Refreshes and returns the store's linked-account activation status. */
  static async getPayoutAccountStatus(storeId) {
    const store = await Store.findById(storeId);
    if (!store) throw ApiError.notFound('Store not found');

    if (store.payoutAccount?.razorpayAccountId && store.payoutAccount.status === 'PENDING') {
      try {
        const razorpay = getRazorpayInstance();
        const account = await razorpay.accounts.fetch(store.payoutAccount.razorpayAccountId);
        if (account?.status === 'activated') {
          store.payoutAccount.status = 'ACTIVE';
          await store.save();
        } else if (account?.status === 'rejected' || account?.status === 'suspended') {
          store.payoutAccount.status = 'REJECTED';
          await store.save();
        }
      } catch (_err) {
        // Keep last-known status if Razorpay lookup fails transiently.
      }
    }

    return store.payoutAccount;
  }

  /**
   * Creates a Razorpay order for a customer to pay online for an already
   * placed store order. Uses Razorpay Route `transfers` so the payout is
   * auto-split to the owner's linked account the moment Razorpay captures
   * the payment — no manual "trust me I paid" step for the customer.
   */
  static async createOrderPaymentIntent(storeId, orderId) {
    const [store, order] = await Promise.all([
      Store.findById(storeId),
      Order.findOne({ _id: orderId, storeId })
    ]);

    if (!store) throw ApiError.notFound('Store not found');
    if (!order) throw ApiError.notFound('Order not found');
    if (order.paymentStatus === 'PAID') {
      throw ApiError.badRequest('This order is already paid.');
    }
    if (store.payoutAccount?.status !== 'ACTIVE') {
      throw ApiError.badRequest('This store has not enabled online payments yet. Please pay at pickup/delivery.');
    }

    const amountInPaise = Math.round(order.grandTotal * 100);
    const commission = Math.round((amountInPaise * PLATFORM_COMMISSION_PERCENT) / 100);
    const transferAmount = amountInPaise - commission;

    const razorpay = getRazorpayInstance();
    const razorpayOrder = await razorpay.orders.create({
      amount: amountInPaise,
      currency: 'INR',
      receipt: order.orderNumber,
      notes: {
        type: 'ORDER_PAYMENT',
        storeId: storeId.toString(),
        orderId: order._id.toString()
      },
      transfers: [
        {
          account: store.payoutAccount.razorpayAccountId,
          amount: transferAmount,
          currency: 'INR',
          on_hold: 0
        }
      ]
    });

    return {
      razorpayOrderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      keyId: process.env.RAZORPAY_KEY_ID || 'rzp_test_dummy',
      storeName: store.name,
      orderNumber: order.orderNumber
    };
  }

  /**
   * Verifies the HMAC signature Razorpay Checkout returns to the browser
   * after a successful payment, then records it. This signature check (not
   * the customer's word, not the shopkeeper's word) is what "confirms" the
   * payment — it can only be produced by Razorpay using your account secret.
   */
  static async verifyOrderPayment(storeId, orderId, paymentData) {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = paymentData;
    const secret = process.env.RAZORPAY_KEY_SECRET || 'dummy_secret';

    const generatedSignature = crypto
      .createHmac('sha256', secret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (generatedSignature !== razorpay_signature) {
      throw ApiError.badRequest('Payment verification failed. Invalid HMAC signature.');
    }

    return this.markOrderPaidFromGateway(storeId, orderId, razorpay_payment_id, {
      razorpay_order_id,
      razorpay_payment_id
    });
  }

  /** Idempotently marks an order PAID and writes the audit Payment row. */
  static async markOrderPaidFromGateway(storeId, orderId, razorpayPaymentId, gatewayResponse) {
    const existing = await Payment.findOne({ gateway: 'RAZORPAY', transactionId: razorpayPaymentId });
    if (existing) {
      return { alreadyRecorded: true, payment: existing };
    }

    const order = await Order.findOne({ _id: orderId, storeId });
    if (!order) throw ApiError.notFound('Order not found');

    const paymentNumber = `PAY-${order.orderNumber}-ONL`;
    const payment = await Payment.create({
      storeId,
      orderId: order._id,
      paymentNumber,
      amount: order.grandTotal,
      method: 'ONLINE',
      status: 'SUCCESS',
      gateway: 'RAZORPAY',
      transactionId: razorpayPaymentId,
      gatewayResponse,
      receivedBy: null
    });

    order.paymentStatus = 'PAID';
    await order.save();

    return { alreadyRecorded: false, payment, order };
  }

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
      PREMIUM: { maxProducts: -1, maxStaffUsers: -1 }
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
      amount: plan.toUpperCase() === 'PREMIUM' ? 999 : 499,
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
      const notesType = payment.notes?.type;

      if (storeId && notesType === 'ORDER_PAYMENT') {
        // Server-to-server confirmation of a customer order payment. This is
        // the authoritative source of truth: it fires even if the customer
        // closes the browser tab right after paying, so the order still gets
        // marked PAID without anyone needing to manually confirm it.
        const orderId = payment.notes?.orderId;
        if (orderId) {
          try {
            await this.markOrderPaidFromGateway(storeId, orderId, payment.id, { webhookEvent: event.event, payment });
          } catch (_err) {
            // Swallow so Razorpay doesn't retry-storm on a stale/duplicate/edge-case event;
            // the client-side verifyOrderPayment call is the primary path and already idempotent.
          }
        }
      } else if (storeId) {
        const plan = payment.notes?.plan || 'PRO';
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
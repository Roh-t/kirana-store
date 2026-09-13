import { Payment } from './payment.model.js';
import { Order } from '../orders/order.model.js';
import { Store } from '../stores/store.model.js';
import { Customer } from '../customers/customer.model.js';
import { ApiError } from '../../utils/apiError.js';

export class PaymentService {
  static async generatePaymentNumber(storeId) {
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 7).replace('-', '');
    const count = await Payment.countDocuments({ storeId });
    const sequence = String(count + 1).padStart(4, '0');
    return `PAY-${dateStr}-${sequence}`;
  }

  static async recordPayment(storeId, userId, validatedData) {
    const { orderId, amount, method, transactionId } = validatedData;

    // 1. Fetch Order and verify Store Tenant
    const order = await Order.findOne({ _id: orderId, storeId });
    if (!order) {
      throw ApiError.notFound('Order not found');
    }

    const paymentNumber = await this.generatePaymentNumber(storeId);

    // 2. Create Payment Document
    const payment = await Payment.create({
      storeId,
      orderId: order._id,
      paymentNumber,
      amount,
      method,
      status: 'SUCCESS',
      gateway: 'MANUAL',
      transactionId,
      receivedBy: userId
    });

    // 3. Accumulate total payments for order
    const allPayments = await Payment.find({
      storeId,
      orderId: order._id,
      status: 'SUCCESS',
      method: { $ne: 'UDHAR' }
    });
    const totalPaid = allPayments.reduce((sum, p) => sum + p.amount, 0);

    if (method === 'UDHAR') {
      order.paymentStatus = 'PENDING';
    } else if (totalPaid >= order.grandTotal) {
      order.paymentStatus = 'PAID';
    } else if (totalPaid > 0) {
      order.paymentStatus = 'PARTIALLY_PAID';
    }
    await order.save();

    // 4. Update Customer Lifetime Spent
    const customer = await Customer.findById(order.customerId);
    if (customer) {
      if (method === 'UDHAR') {
        customer.udharBalance += amount;
      } else {
        customer.totalSpent += amount;
      }
      await customer.save();
    }

    return {
      payment,
      order
    };
  }

  static async generateStoreUpiQrPayload(storeId, orderId) {
    const [store, order] = await Promise.all([
      Store.findById(storeId),
      Order.findOne({ _id: orderId, storeId })
    ]);

    if (!store) throw ApiError.notFound('Store not found');
    if (!order) throw ApiError.notFound('Order not found');

    const upiId = store.qrConfig?.upiId || 'store@upi';
    const payeeName = encodeURIComponent(store.qrConfig?.payeeName || store.name);
    const amount = order.grandTotal.toFixed(2);
    const orderRef = order.orderNumber;

    // NPCI Standard Indian UPI URI Format
    const upiUri = `upi://pay?pa=${upiId}&pn=${payeeName}&am=${amount}&tr=${orderRef}&tn=${encodeURIComponent(`Payment for Order ${orderRef}`)}&cu=INR`;

    return {
      storeName: store.name,
      upiId,
      payeeName: store.qrConfig?.payeeName || store.name,
      amount: order.grandTotal,
      orderNumber: order.orderNumber,
      upiUri
    };
  }

  static async getPaymentsByOrder(storeId, orderId) {
    return Payment.find({ storeId, orderId }).sort({ createdAt: -1 });
  }

  static async submitPaymentProof(slug, orderId, proofData) {
    const store = await Store.findOne({ slug: slug.toLowerCase(), status: 'ACTIVE' });
    const order = store && await Order.findOne({ _id: orderId, storeId: store._id });
    if (!store) throw ApiError.notFound('Kirana store not found or currently offline');
    if (!order) throw ApiError.notFound('Order not found');
    if (order.paymentStatus === 'PAID') throw ApiError.badRequest('This order is already paid.');

    if (!proofData?.imageData || !proofData.imageData.startsWith('data:image/')) {
      throw ApiError.badRequest('A valid payment screenshot is required.');
    }
    if (proofData.imageData.length > 6 * 1024 * 1024) {
      throw ApiError.badRequest('Payment screenshot is too large. Maximum size is 4 MB.');
    }

    const existingPending = await Payment.findOne({
      storeId: store._id,
      orderId: order._id,
      status: 'PENDING'
    });
    if (existingPending) {
      existingPending.proofImageData = proofData.imageData;
      existingPending.transactionId = proofData.transactionId?.trim() || null;
      existingPending.proofSubmittedAt = new Date();
      await existingPending.save();
      return existingPending;
    }

    return Payment.create({
      storeId: store._id,
      orderId: order._id,
      paymentNumber: await this.generatePaymentNumber(store._id),
      amount: order.grandTotal,
      method: 'UPI',
      status: 'PENDING',
      gateway: 'MANUAL',
      transactionId: proofData.transactionId?.trim() || null,
      proofImageData: proofData.imageData,
      proofSubmittedAt: new Date()
    });
  }

  static async verifyPayment(storeId, userId, paymentId) {
    const payment = await Payment.findOne({ _id: paymentId, storeId, status: 'PENDING' });
    if (!payment) throw ApiError.notFound('Pending payment proof not found');

    const order = await Order.findOne({ _id: payment.orderId, storeId });
    if (!order) throw ApiError.notFound('Order not found');

    payment.status = 'SUCCESS';
    payment.receivedBy = userId;
    payment.verifiedBy = userId;
    payment.verifiedAt = new Date();
    await payment.save();

    const successfulPayments = await Payment.find({
      storeId,
      orderId: order._id,
      status: 'SUCCESS',
      method: { $ne: 'UDHAR' }
    });
    const totalPaid = successfulPayments.reduce((sum, item) => sum + item.amount, 0);
    order.paymentStatus = totalPaid >= order.grandTotal ? 'PAID' : 'PARTIALLY_PAID';
    await order.save();

    return { payment, order };
  }
}
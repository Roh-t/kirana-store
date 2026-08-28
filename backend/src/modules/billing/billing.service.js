import { Invoice } from './invoice.model.js';
import { Order } from '../orders/order.model.js';
import { Customer } from '../customers/customer.model.js';
import { Store } from '../stores/store.model.js';
import { ApiError } from '../../utils/apiError.js';

export class BillingService {
  static async generateInvoiceNumber(storeId) {
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 7).replace('-', '');
    const count = await Invoice.countDocuments({ storeId });
    const sequence = String(count + 1).padStart(4, '0');
    return `INV-${dateStr}-${sequence}`;
  }

  static async generateInvoiceForOrder(storeId, userId, validatedData) {
    const { orderId, paymentMethod, paidAmount } = validatedData;

    // 1. Fetch Order and Store Profile
    const [order, store] = await Promise.all([
      Order.findOne({ _id: orderId, storeId }),
      Store.findById(storeId)
    ]);

    if (!order) {
      throw ApiError.notFound('Order not found');
    }

    // 2. Check if invoice already exists
    let existingInvoice = await Invoice.findOne({ storeId, orderId: order._id });
    if (existingInvoice) {
      return { invoice: existingInvoice, store, order };
    }

    const actualPaid = paidAmount !== null ? paidAmount : paymentMethod === 'UDHAR' ? 0 : order.grandTotal;
    const dueAmount = Math.max(0, order.grandTotal - actualPaid);

    const invoiceNumber = await this.generateInvoiceNumber(storeId);

    // 3. Create Immutable Invoice Record
    const invoice = await Invoice.create({
      storeId,
      orderId: order._id,
      invoiceNumber,
      customerSnapshot: {
        name: order.customerDetails.name,
        phone: order.customerDetails.phone
      },
      subTotal: order.subTotal,
      taxTotal: order.taxTotal,
      discountTotal: order.discountTotal,
      grandTotal: order.grandTotal,
      generatedAt: new Date()
    });

    // 4. Update Order Payment Status
    if (actualPaid >= order.grandTotal) {
      order.paymentStatus = 'PAID';
    } else if (actualPaid > 0) {
      order.paymentStatus = 'PARTIALLY_PAID';
    } else if (paymentMethod === 'UDHAR') {
      order.paymentStatus = 'PENDING';
    }
    await order.save();

    // 5. Update Customer Metrics & Udhar Ledger if credit used
    const customer = await Customer.findById(order.customerId);
    if (customer) {
      customer.totalSpent += actualPaid;
      if (dueAmount > 0 || paymentMethod === 'UDHAR') {
        customer.udharBalance += dueAmount > 0 ? dueAmount : order.grandTotal;
      }
      await customer.save();
    }

    return {
      invoice,
      store,
      order
    };
  }

  static async getInvoicesByStore(storeId, limit = 20) {
    return Invoice.find({ storeId })
      .populate('orderId', 'orderNumber orderType paymentStatus items')
      .sort({ generatedAt: -1 })
      .limit(Number(limit));
  }

  static async getInvoiceById(storeId, invoiceId) {
    const invoice = await Invoice.findOne({ _id: invoiceId, storeId }).populate({
      path: 'orderId',
      populate: { path: 'storeId' }
    });

    if (!invoice) {
      throw ApiError.notFound('Invoice not found');
    }
    return invoice;
  }
}
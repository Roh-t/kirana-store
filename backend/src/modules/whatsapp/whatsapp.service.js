import { Order } from '../orders/order.model.js';
import { Customer } from '../customers/customer.model.js';
import { Store } from '../stores/store.model.js';
import { WhatsAppUtil } from '../../utils/whatsapp.util.js';
import { ApiError } from '../../utils/apiError.js';

export class WhatsAppService {
  static async getOrderWhatsAppLink(storeId, orderId) {
    const [store, order] = await Promise.all([
      Store.findById(storeId),
      Order.findOne({ _id: orderId, storeId })
    ]);

    if (!store) throw ApiError.notFound('Store not found');
    if (!order) throw ApiError.notFound('Order not found');

    const whatsappUrl = WhatsAppUtil.buildOrderMessageLink(
      order.customerDetails.phone,
      store.name,
      order.orderNumber,
      order.orderStatus,
      order.grandTotal
    );

    return { whatsappUrl };
  }

  static async getUdharWhatsAppLink(storeId, customerId) {
    const [store, customer] = await Promise.all([
      Store.findById(storeId),
      Customer.findOne({ _id: customerId, storeId })
    ]);

    if (!store) throw ApiError.notFound('Store not found');
    if (!customer) throw ApiError.notFound('Customer profile not found');

    const whatsappUrl = WhatsAppUtil.buildUdharReminderLink(
      customer.phone,
      customer.name,
      store.name,
      customer.udharBalance,
      store.qrConfig?.upiId
    );

    return { whatsappUrl };
  }
}
import { Order } from './order.model.js';
import { Store } from '../stores/store.model.js';
import { Product } from '../products/product.model.js';
import { Inventory } from '../inventory/inventory.model.js';
import { InventoryTransaction } from '../inventory/inventoryTransaction.model.js';
import { CustomerService } from '../customers/customer.service.js';
import { NotificationService } from '../notifications/notification.service.js';
import { AuditService } from '../auditLogs/audit.service.js';
import { ApiError } from '../../utils/apiError.js';
import { getStoreAvailability } from '../stores/storeHours.util.js';

export class OrderService {
  static async generateOrderNumber(storeId) {
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 7).replace('-', '');
    const count = await Order.countDocuments({ storeId });
    const sequence = String(count + 1).padStart(4, '0');
    return `ORD-${dateStr}-${sequence}`;
  }

  static async createPublicOrder(slug, validatedData) {
    const store = await Store.findOne({ slug: slug.toLowerCase(), status: 'ACTIVE' });
    if (!store) {
      throw ApiError.notFound('Kirana store not found or currently offline');
    }

    const customer = await CustomerService.findOrCreateCustomer(
      store._id,
      validatedData.customerDetails.phone,
      validatedData.customerDetails.name
    );

    let subTotal = 0;
    let taxTotal = 0;
    const snapshottedItems = [];

    for (const reqItem of validatedData.items) {
      const product = await Product.findOne({
        _id: reqItem.productId,
        storeId: store._id,
        isActive: true,
        isAvailable: true,
        isDeleted: false
      });

      if (!product) {
        throw ApiError.badRequest(`Item "${reqItem.productId}" is no longer available in catalog.`);
      }

      const lineSubTotal = product.sellingPrice * reqItem.quantity;
      const lineTaxAmount = (lineSubTotal * product.taxRate) / 100;
      const lineGrandTotal = lineSubTotal + lineTaxAmount;

      subTotal += lineSubTotal;
      taxTotal += lineTaxAmount;

      snapshottedItems.push({
        productId: product._id,
        nameSnapshot: product.name,
        unitSnapshot: `${product.unitQuantity} ${product.unit}`,
        mrpSnapshot: product.mrp,
        sellingPriceSnapshot: product.sellingPrice,
        purchasePriceSnapshot: product.purchasePrice || 0,
        taxRateSnapshot: product.taxRate || 0,
        quantity: reqItem.quantity,
        lineSubTotal,
        lineTaxAmount,
        lineGrandTotal
      });
    }

    const minOrder = store.businessConfig.minOrderValue || 0;
    if (subTotal < minOrder) {
      throw ApiError.badRequest(`Minimum order value for ${store.name} is ₹${minOrder}. Your total: ₹${subTotal}`);
    }

    const grandTotal = subTotal + taxTotal;
    const orderNumber = await this.generateOrderNumber(store._id);
    const activeQueueCount = await Order.countDocuments({
      storeId: store._id,
      orderStatus: { $in: ['PENDING', 'ACCEPTED', 'PREPARING', 'PACKING'] }
    });
    const preparationMinutes = store.businessConfig.preparationMinutes || 10;
    const bufferMinutes = store.businessConfig.bufferMinutes || 0;
    const workerCount = store.businessConfig.workerCount || 1;
    const queuePosition = Math.floor(activeQueueCount / workerCount) + 1;
    const availability = getStoreAvailability(store);
    const preparationStart = availability.nextOpeningAt || new Date();
    const effectivePreparationMinutes = availability.isOpen ? preparationMinutes : Math.max(preparationMinutes, 15);
    const estimatedReadyAt = new Date(preparationStart.getTime() + queuePosition * (effectivePreparationMinutes + bufferMinutes) * 60000);

    const order = await Order.create({
      storeId: store._id,
      orderNumber,
      customerId: customer._id,
      customerDetails: validatedData.customerDetails,
      orderType: validatedData.orderType,
      items: snapshottedItems,
      subTotal,
      discountTotal: 0,
      taxTotal,
      deliveryFee: 0,
      grandTotal,
      paymentStatus: 'PENDING',
      orderStatus: 'PENDING',
      stockDeducted: false,
      estimatedReadyAt,
      notes: validatedData.notes
    });

    customer.totalOrders += 1;
    customer.lastOrderAt = new Date();
    await customer.save();

    await NotificationService.createNotification(store._id, null, {
      type: 'NEW_ORDER',
      title: 'New Customer Order Received',
      message: `Order ${orderNumber} placed by ${validatedData.customerDetails.name} (Total: ₹${grandTotal})`,
      data: { orderId: order._id, orderNumber }
    });

    return order;
  }

  static async deductInventoryForOrder(order, userId) {
    if (order.stockDeducted) return;

    for (const item of order.items) {
      let inventory = await Inventory.findOne({ storeId: order.storeId, productId: item.productId });
      if (!inventory) {
        inventory = await Inventory.create({
          storeId: order.storeId,
          productId: item.productId,
          stockQuantity: 0,
          reservedQuantity: 0,
          reorderPoint: 5
        });
      }

      const previousStock = inventory.stockQuantity;
      const newStock = Math.max(0, previousStock - item.quantity);

      inventory.stockQuantity = newStock;
      await inventory.save();

      await InventoryTransaction.create({
        storeId: order.storeId,
        productId: item.productId,
        type: 'SALE',
        quantityDelta: -item.quantity,
        previousStock,
        newStock,
        referenceId: order._id,
        reason: `Automated sale deduction for order ${order.orderNumber}`,
        createdBy: userId
      });

      if (newStock <= inventory.reorderPoint) {
        await NotificationService.createNotification(order.storeId, null, {
          type: 'LOW_STOCK_ALERT',
          title: 'Low Stock Warning',
          message: `Product "${item.nameSnapshot}" is low in stock (${newStock} remaining)`,
          data: { productId: item.productId }
        });
      }
    }

    order.stockDeducted = true;
    await order.save();
  }

  static async revertInventoryForOrder(order, userId) {
    if (!order.stockDeducted) return;

    for (const item of order.items) {
      let inventory = await Inventory.findOne({ storeId: order.storeId, productId: item.productId });
      if (inventory) {
        const previousStock = inventory.stockQuantity;
        const newStock = previousStock + item.quantity;

        inventory.stockQuantity = newStock;
        await inventory.save();

        await InventoryTransaction.create({
          storeId: order.storeId,
          productId: item.productId,
          type: 'RETURN',
          quantityDelta: item.quantity,
          previousStock,
          newStock,
          referenceId: order._id,
          reason: `Automated stock reversal for cancelled order ${order.orderNumber}`,
          createdBy: userId
        });
      }
    }

    order.stockDeducted = false;
    await order.save();
  }

  static async getStoreOrderQueue(storeId, filters = {}) {
    const { status, page = 1, limit = 50 } = filters;
    const query = { storeId };

    if (status && status !== 'ALL') {
      query.orderStatus = status;
    }

    const skip = (page - 1) * limit;

    const [orders, totalRecords, statusCounts] = await Promise.all([
      Order.find(query)
        .populate('customerId', 'name phone udharBalance')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Order.countDocuments(query),
      Order.aggregate([
        { $match: { storeId } },
        { $group: { _id: '$orderStatus', count: { $sum: 1 } } }
      ])
    ]);

    const statusSummary = {
      PENDING: 0,
      ACCEPTED: 0,
      PACKING: 0,
      READY: 0,
      COMPLETED: 0,
      CANCELLED: 0
    };

    statusCounts.forEach((sc) => {
      statusSummary[sc._id] = sc.count;
    });

    return {
      orders,
      statusSummary,
      pagination: {
        totalRecords,
        currentPage: Number(page),
        totalPages: Math.ceil(totalRecords / limit) || 1
      }
    };
  }

  static async updateOrderStatus(storeId, userId, orderId, nextStatus, cancellationReason) {
    const order = await Order.findOne({ _id: orderId, storeId });
    if (!order) {
      throw ApiError.notFound('Order not found');
    }

    const validTransitions = {
      PENDING: ['ACCEPTED', 'CANCELLED'],
      ACCEPTED: ['PACKING', 'CANCELLED'],
      PACKING: ['READY', 'CANCELLED'],
      READY: ['COMPLETED', 'CANCELLED'],
      COMPLETED: [],
      CANCELLED: []
    };

    const allowedNext = validTransitions[order.orderStatus] || [];
    if (!allowedNext.includes(nextStatus)) {
      throw ApiError.badRequest(
        `Invalid status transition from "${order.orderStatus}" to "${nextStatus}". Allowed: ${allowedNext.join(', ') || 'None'}`
      );
    }

    if (nextStatus === 'ACCEPTED' && !order.stockDeducted) {
      await this.deductInventoryForOrder(order, userId);
    }

    if (nextStatus === 'CANCELLED' && order.stockDeducted) {
      await this.revertInventoryForOrder(order, userId);
    }

    const prevStatus = order.orderStatus;
    order.orderStatus = nextStatus;
    order.fulfilledBy = userId;

    if (nextStatus === 'COMPLETED') {
      order.completedAt = new Date();
      if (!order.stockDeducted) {
        await this.deductInventoryForOrder(order, userId);
      }
    }

    if (nextStatus === 'CANCELLED') {
      order.cancellationReason = cancellationReason || 'Cancelled by storekeeper';
    }

    await order.save();

    // RECORD SECURITY AUDIT LOG
    await AuditService.recordLog(
      storeId,
      userId,
      `ORDER_${nextStatus}`,
      'Order',
      order._id,
      { orderNumber: order.orderNumber, prevStatus, nextStatus, cancellationReason }
    );

    return order;
  }

  static async getOrderById(orderId) {
    const order = await Order.findById(orderId).populate('storeId', 'name phone address logoUrl');
    if (!order) {
      throw ApiError.notFound('Order details not found');
    }
    return order;
  }

  // Add inside OrderService class in backend/src/modules/orders/order.service.js

static async modifyOrderItems(storeId, userId, orderId, updatedItems, reason) {
  const order = await Order.findOne({ _id: orderId, storeId });
  if (!order) {
    throw ApiError.notFound('Order not found');
  }

  if (['COMPLETED', 'CANCELLED'].includes(order.orderStatus)) {
    throw ApiError.badRequest('Cannot modify items of completed or cancelled orders.');
  }

  let subTotal = 0;
  let taxTotal = 0;
  const newSnapshottedItems = [];

  for (const item of updatedItems) {
    const product = await Product.findOne({ _id: item.productId, storeId, isDeleted: false });
    if (!product) continue;

    const lineSubTotal = product.sellingPrice * item.quantity;
    const lineTaxAmount = (lineSubTotal * product.taxRate) / 100;
    const lineGrandTotal = lineSubTotal + lineTaxAmount;

    subTotal += lineSubTotal;
    taxTotal += lineTaxAmount;

    newSnapshottedItems.push({
      productId: product._id,
      nameSnapshot: product.name,
      unitSnapshot: `${product.unitQuantity} ${product.unit}`,
      mrpSnapshot: product.mrp,
      sellingPriceSnapshot: product.sellingPrice,
      purchasePriceSnapshot: product.purchasePrice || 0,
      taxRateSnapshot: product.taxRate || 0,
      quantity: item.quantity,
      lineSubTotal,
      lineTaxAmount,
      lineGrandTotal
    });
  }

  order.items = newSnapshottedItems;
  order.subTotal = subTotal;
  order.taxTotal = taxTotal;
  order.grandTotal = subTotal + taxTotal;
  order.notes = reason ? `[Item Adjusted: ${reason}] ${order.notes || ''}` : order.notes;

  await order.save();

  // Record Audit Trail
  await AuditService.recordLog(storeId, userId, 'ORDER_ITEMS_MODIFIED', 'Order', order._id, {
    orderNumber: order.orderNumber,
    newGrandTotal: order.grandTotal,
    reason
  });

  return order;
}
}


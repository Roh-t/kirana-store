import { Order } from '../orders/order.model.js';
import { Customer } from '../customers/customer.model.js';
import { Product } from '../products/product.model.js';
import { Inventory } from '../inventory/inventory.model.js';

export class AnalyticsService {
  static async getDashboardMetrics(storeId) {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [
      revenueAggregate,
      todayRevenueAggregate,
      orderCounts,
      todayOrderCount,
      udharAggregate,
      topProducts,
      lowStockCount,
      trendOrders,
      paymentMix,
      customerCount
    ] = await Promise.all([
      // 1. Lifetime Revenue & Estimated Profit
      Order.aggregate([
        { $match: { storeId, orderStatus: { $ne: 'CANCELLED' } } },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: '$grandTotal' },
            subTotal: { $sum: '$subTotal' }
          }
        }
      ]),

      // 2. Today's Revenue
      Order.aggregate([
        { $match: { storeId, orderStatus: { $ne: 'CANCELLED' }, createdAt: { $gte: todayStart } } },
        { $group: { _id: null, todayRevenue: { $sum: '$grandTotal' } } }
      ]),

      // 3. Order Status Breakdown
      Order.aggregate([
        { $match: { storeId } },
        { $group: { _id: '$orderStatus', count: { $sum: 1 } } }
      ]),

      // 4. Today's Total Orders
      Order.countDocuments({ storeId, createdAt: { $gte: todayStart } }),

      // 5. Total Market Udhar Pending
      Customer.aggregate([
        { $match: { storeId, status: 'ACTIVE' } },
        { $group: { _id: null, totalUdhar: { $sum: '$udharBalance' } } }
      ]),

      // 6. Top 5 Selling Products
      Order.aggregate([
        { $match: { storeId, orderStatus: 'COMPLETED' } },
        { $unwind: '$items' },
        {
          $group: {
            _id: '$items.nameSnapshot',
            totalQuantity: { $sum: '$items.quantity' },
            totalSales: { $sum: '$items.lineGrandTotal' }
          }
        },
        { $sort: { totalSales: -1 } },
        { $limit: 5 }
      ]),

      // 7. Low Stock Alerts Count
      Inventory.countDocuments({
        storeId,
        $expr: { $lte: ['$stockQuantity', '$reorderPoint'] }
      }),

      // 8. Seven-day revenue and order trend
      Order.aggregate([
        {
          $match: {
            storeId,
            orderStatus: { $ne: 'CANCELLED' },
            createdAt: { $gte: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000) }
          }
        },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            revenue: { $sum: '$grandTotal' },
            orders: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ]),

      // 9. Payment mix for completed revenue
      Order.aggregate([
        { $match: { storeId, orderStatus: { $ne: 'CANCELLED' } } },
        { $group: { _id: '$paymentStatus', value: { $sum: '$grandTotal' }, orders: { $sum: 1 } } }
      ]),

      // 10. Active customer base
      Customer.countDocuments({ storeId, status: 'ACTIVE' })
    ]);

    const statusCounts = {
      PENDING: 0,
      ACCEPTED: 0,
      PREPARING: 0,
      PACKING: 0,
      READY: 0,
      COMPLETED: 0,
      CANCELLED: 0
    };

    let totalOrders = 0;
    orderCounts.forEach((sc) => {
      statusCounts[sc._id] = sc.count;
      totalOrders += sc.count;
    });

    const totalRevenue = revenueAggregate[0]?.totalRevenue || 0;
    const todayRevenue = todayRevenueAggregate[0]?.todayRevenue || 0;
    const totalUdhar = udharAggregate[0]?.totalUdhar || 0;
    const paidOrders = paymentMix.find((payment) => payment._id === 'PAID')?.orders || 0;

    // Estimate Profit (~12% average grocery margin calculation)
    const estimatedProfit = Math.round(totalRevenue * 0.12);

    return {
      kpis: {
        totalRevenue,
        todayRevenue,
        estimatedProfit,
        totalOrders,
        todayOrders: todayOrderCount,
        pendingOrders:
          (statusCounts.PENDING || 0) +
          (statusCounts.ACCEPTED || 0) +
          (statusCounts.PREPARING || 0) +
          (statusCounts.PACKING || 0),
        totalUdhar,
        lowStockCount,
        activeCustomers: customerCount,
        paidOrders
      },
      statusCounts,
      topProducts,
      trendOrders,
      paymentMix
    };
  }
}
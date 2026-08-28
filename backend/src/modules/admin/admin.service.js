import { Store } from '../stores/store.model.js';
import { User } from '../users/user.model.js';
import { Order } from '../orders/order.model.js';
import { ApiError } from '../../utils/apiError.js';

export class AdminService {
  static async getPlatformMetrics() {
    const [totalStores, activeStores, totalUsers, totalOrders, gmvAggregate] = await Promise.all([
      Store.countDocuments({}),
      Store.countDocuments({ status: 'ACTIVE' }),
      User.countDocuments({}),
      Order.countDocuments({}),
      Order.aggregate([
        { $match: { orderStatus: { $ne: 'CANCELLED' } } },
        { $group: { _id: null, totalGmv: { $sum: '$grandTotal' } } }
      ])
    ]);

    return {
      totalStores,
      activeStores,
      suspendedStores: totalStores - activeStores,
      totalUsers,
      totalOrders,
      totalGmv: gmvAggregate[0]?.totalGmv || 0
    };
  }

  static async getAllStores(options = {}) {
    const { search, status, page = 1, limit = 20 } = options;
    const query = {};

    if (status) {
      query.status = status;
    }

    if (search && search.trim().length > 0) {
      const regex = new RegExp(search.trim(), 'i');
      query.$or = [{ name: regex }, { slug: regex }, { phone: regex }];
    }

    const skip = (page - 1) * limit;

    const [stores, totalRecords] = await Promise.all([
      Store.find(query)
        .populate('ownerId', 'name phone email')
        .populate('subscriptionId', 'plan status')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Store.countDocuments(query)
    ]);

    return {
      stores,
      pagination: {
        totalRecords,
        currentPage: Number(page),
        totalPages: Math.ceil(totalRecords / limit) || 1
      }
    };
  }

  static async toggleStoreStatus(storeId, status) {
    const store = await Store.findById(storeId);
    if (!store) {
      throw ApiError.notFound('Store tenant not found');
    }

    store.status = status;
    await store.save();
    return store;
  }
}
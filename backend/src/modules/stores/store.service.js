import { Store } from './store.model.js';
import { User } from '../users/user.model.js';
import { Role } from '../roles/role.model.js';
import { Subscription } from '../subscriptions/subscription.model.js';
import { ApiError } from '../../utils/apiError.js';
import { SYSTEM_ROLES } from '../../constants/roles.js';

export class StoreService {
  static async generateUniqueSlug(storeName) {
    let baseSlug = storeName
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-');

    if (!baseSlug) baseSlug = 'kirana-store';

    let slug = baseSlug;
    let count = 1;

    while (await Store.findOne({ slug })) {
      slug = `${baseSlug}-${count}`;
      count++;
    }

    return slug;
  }

  static async createStore(userId, validatedData) {
    const user = await User.findById(userId);
    if (!user) {
      throw ApiError.notFound('User not found');
    }

    const slug = await this.generateUniqueSlug(validatedData.name);

    const store = await Store.create({
      name: validatedData.name,
      slug,
      ownerId: user._id,
      phone: validatedData.phone,
      logoUrl: validatedData.logoUrl || null,
      address: validatedData.address,
      businessConfig: {
        currency: 'INR',
        timezone: 'Asia/Kolkata',
        isAcceptingOrders: true,
        minOrderValue: validatedData.businessConfig?.minOrderValue || 0,
        autoAcceptOrders: validatedData.businessConfig?.autoAcceptOrders || false,
        enableDelivery: validatedData.businessConfig?.enableDelivery ?? true,
        enablePickup: validatedData.businessConfig?.enablePickup ?? true
      },
      taxConfig: {
        gstin: validatedData.taxConfig?.gstin || null,
        isTaxInclusive: validatedData.taxConfig?.isTaxInclusive ?? true
      },
      qrConfig: {
        upiId: validatedData.qrConfig?.upiId || null,
        payeeName: validatedData.qrConfig?.payeeName || validatedData.name
      },
      status: 'ACTIVE'
    });

    // Get or Create STORE_OWNER Role
    let ownerRole = await Role.findOne({ name: SYSTEM_ROLES.STORE_OWNER, isSystemRole: true });
    if (!ownerRole) {
      ownerRole = await Role.create({
        name: SYSTEM_ROLES.STORE_OWNER,
        displayName: 'Store Owner',
        description: 'Full administrative access',
        isSystemRole: true,
        permissions: []
      });
    }

    // Attach role to user
    user.roles.push({
      storeId: store._id,
      roleId: ownerRole._id
    });
    user.activeStoreId = store._id;
    await user.save();

    // Initialize Default Subscription (14-Day Free Trial)
    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + 14);

    const subscription = await Subscription.create({
      storeId: store._id,
      plan: 'FREE',
      status: 'TRIAL',
      startDate: new Date(),
      endDate: trialEndsAt,
      trialEndsAt,
      maxProducts: 100,
      maxStaffUsers: 2
    });

    store.subscriptionId = subscription._id;
    await store.save();

    return store;
  }

  static async getMyStores(userId) {
    const user = await User.findById(userId).populate('roles.storeId');
    if (!user) {
      throw ApiError.notFound('User not found');
    }

    // Filter non-null store references from user roles
    const storesMap = new Map();
    user.roles.forEach((r) => {
      if (r.storeId && typeof r.storeId === 'object') {
        storesMap.set(r.storeId._id.toString(), r.storeId);
      }
    });

    return Array.from(storesMap.values());
  }

  static async getStoreById(storeId) {
    const store = await Store.findById(storeId).populate('ownerId', 'name phone email');
    if (!store) {
      throw ApiError.notFound('Store not found');
    }
    return store;
  }

  static async getPublicStoreBySlug(slug) {
    const store = await Store.findOne({ slug: slug.toLowerCase(), status: 'ACTIVE' }).select(
      'name slug phone logoUrl address businessConfig qrConfig'
    );

    if (!store) {
      throw ApiError.notFound('Store not found or currently inactive');
    }

    return store;
  }

  static async updateStore(storeId, updateData) {
    const store = await Store.findById(storeId);
    if (!store) {
      throw ApiError.notFound('Store not found');
    }

    if (updateData.name) store.name = updateData.name;
    if (updateData.phone) store.phone = updateData.phone;
    if (updateData.logoUrl !== undefined) store.logoUrl = updateData.logoUrl;
    if (updateData.address) store.address = { ...store.address, ...updateData.address };
    if (updateData.businessConfig) store.businessConfig = { ...store.businessConfig, ...updateData.businessConfig };
    if (updateData.taxConfig) store.taxConfig = { ...store.taxConfig, ...updateData.taxConfig };
    if (updateData.qrConfig) store.qrConfig = { ...store.qrConfig, ...updateData.qrConfig };

    await store.save();
    return store;
  }
}
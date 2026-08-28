import { Subscription } from './subscription.model.js';
import { Product } from '../products/product.model.js';
import { User } from '../users/user.model.js';
import { ApiError } from '../../utils/apiError.js';

export class SubscriptionService {
  static async getStoreSubscription(storeId) {
    let sub = await Subscription.findOne({ storeId });
    if (!sub) {
      const trialEndsAt = new Date();
      trialEndsAt.setDate(trialEndsAt.getDate() + 14);

      sub = await Subscription.create({
        storeId,
        plan: 'FREE',
        status: 'TRIAL',
        startDate: new Date(),
        endDate: trialEndsAt,
        trialEndsAt,
        maxProducts: 100,
        maxStaffUsers: 2
      });
    }

    const [productCount, staffCount] = await Promise.all([
      Product.countDocuments({ storeId, isDeleted: false }),
      User.countDocuments({ 'roles.storeId': storeId })
    ]);

    return {
      subscription: sub,
      usage: {
        products: {
          current: productCount,
          max: sub.maxProducts,
          isLimitReached: sub.maxProducts !== -1 && productCount >= sub.maxProducts
        },
        staff: {
          current: staffCount,
          max: sub.maxStaffUsers,
          isLimitReached: sub.maxStaffUsers !== -1 && staffCount >= sub.maxStaffUsers
        }
      }
    };
  }

  static async enforceProductLimit(storeId) {
    const { usage } = await this.getStoreSubscription(storeId);
    if (usage.products.isLimitReached) {
      throw ApiError.forbidden(
        `Product limit reached (${usage.products.current}/${usage.products.max}). Please upgrade your SaaS plan to add more products.`
      );
    }
  }

  static async enforceStaffLimit(storeId) {
    const { usage } = await this.getStoreSubscription(storeId);
    if (usage.staff.isLimitReached) {
      throw ApiError.forbidden(
        `Staff account limit reached (${usage.staff.current}/${usage.staff.max}). Please upgrade your SaaS plan to invite more staff.`
      );
    }
  }

  static async upgradePlan(storeId, plan) {
    let sub = await Subscription.findOne({ storeId });
    if (!sub) {
      sub = new Subscription({ storeId });
    }

    const planLimits = {
      FREE: { maxProducts: 100, maxStaffUsers: 2 },
      PRO: { maxProducts: 1000, maxStaffUsers: 10 },
      PREMIUM: { maxProducts: -1, maxStaffUsers: -1 } // -1 = Unlimited
    };

    const targetLimits = planLimits[plan.toUpperCase()] || planLimits.FREE;

    const nextEndDate = new Date();
    nextEndDate.setDate(nextEndDate.getDate() + 30); // 30 day billing term

    sub.plan = plan.toUpperCase();
    sub.status = 'ACTIVE';
    sub.endDate = nextEndDate;
    sub.maxProducts = targetLimits.maxProducts;
    sub.maxStaffUsers = targetLimits.maxStaffUsers;

    await sub.save();
    return sub;
  }
}
import { ApiError } from '../utils/apiError.js';
import { Store } from '../modules/stores/store.model.js';

export const tenantContext = async (req, res, next) => {
  try {
    let storeId = null;

    // 1. Check Header (for staff operating on active store dashboard)
    const headerStoreId = req.headers['x-store-id'];

    // 2. Check Public Store Slug (for public customer requests)
    const storeSlug = req.params.slug || req.query.storeSlug;

    if (storeSlug) {
      const store = await Store.findOne({ slug: storeSlug.toLowerCase(), status: 'ACTIVE' }).select('_id');
      if (!store) {
        throw ApiError.notFound('Store not found or currently inactive');
      }
      storeId = store._id.toString();
    } else if (req.user) {
      // 3. For authenticated users, verify access to target storeId
      if (headerStoreId) {
        const hasAccess = req.user.roles.some(
          (r) => r.storeId && r.storeId.toString() === headerStoreId
        );
        if (!hasAccess && !req.user.roles.some(r => r.roleId?.name === 'SUPER_ADMIN')) {
          throw ApiError.forbidden('Unauthorized access to specified store tenant');
        }
        storeId = headerStoreId;
      } else if (req.user.activeStoreId) {
        storeId = req.user.activeStoreId.toString();
      }
    }

    if (!storeId && !req.isPublicRoute) {
      throw ApiError.badRequest('Tenant context missing. Store ID required.');
    }

    req.storeId = storeId;
    next();
  } catch (error) {
    next(error);
  }
};
import { ApiError } from '../utils/apiError.js';

export const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(ApiError.unauthorized());
    }

    // Check if user has active role matching allowedRoles
    const userRoleNames = req.user.roles.map((r) => r.roleId?.name || r.roleId);
    
    // SuperAdmin bypass
    if (userRoleNames.includes('SUPER_ADMIN')) {
      return next();
    }

    const hasPermission = allowedRoles.some((role) => userRoleNames.includes(role));

    if (!hasPermission) {
      return next(ApiError.forbidden('You do not have permission to perform this action.'));
    }

    next();
  };
};
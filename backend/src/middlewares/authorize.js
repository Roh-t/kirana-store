import { ApiError } from '../utils/apiError.js';

export const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(ApiError.unauthorized());
    }

    // Check if user has active role matching allowedRoles
    const userRoleNames = req.user.roles.map((r) => {
      const roleName = r.roleId?.name || r.roleId;
      return typeof roleName === 'string' ? roleName.toUpperCase() : roleName;
    });
    
    // SuperAdmin bypass
    if (userRoleNames.includes('SUPER_ADMIN')) {
      return next();
    }

    const hasPermission = allowedRoles.some((role) => userRoleNames.includes(role.toUpperCase()));

    if (!hasPermission) {
      return next(ApiError.forbidden('You do not have permission to perform this action.'));
    }

    next();
  };
};
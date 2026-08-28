import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env.js';
import { ApiError } from '../../utils/apiError.js';
import { User } from '../users/user.model.js';
import { Role } from '../roles/role.model.js';
import { SYSTEM_ROLES } from '../../constants/roles.js';

export class AuthService {
  static generateToken(user) {
    const payload = {
      sub: user._id.toString(),
      phone: user.phone,
      activeStoreId: user.activeStoreId ? user.activeStoreId.toString() : null
    };

    return jwt.sign(payload, env.jwtSecret, { expiresIn: '7d' });
  }

  static async register(validatedData) {
    const existingUser = await User.findOne({ phone: validatedData.phone });
    if (existingUser) {
      throw ApiError.conflict('A user with this phone number already exists.');
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(validatedData.password, salt);

    // Get default STORE_OWNER system role
    let ownerRole = await Role.findOne({ name: SYSTEM_ROLES.STORE_OWNER, isSystemRole: true });
    
    if (!ownerRole) {
      ownerRole = await Role.create({
        name: SYSTEM_ROLES.STORE_OWNER,
        displayName: 'Store Owner',
        description: 'Full administrative access to owned store',
        isSystemRole: true,
        permissions: []
      });
    }

    const user = await User.create({
      name: validatedData.name,
      phone: validatedData.phone,
      email: validatedData.email || null,
      passwordHash,
      status: 'ACTIVE'
    });

    const token = this.generateToken(user);

    return {
      user: {
        id: user._id,
        name: user.name,
        phone: user.phone,
        email: user.email,
        activeStoreId: user.activeStoreId
      },
      token
    };
  }

  static async login(validatedData) {
    const user = await User.findOne({ phone: validatedData.phone }).select('+passwordHash').populate('roles.roleId');

    if (!user) {
      throw ApiError.unauthorized('Invalid phone number or password.');
    }

    const isMatch = await bcrypt.compare(validatedData.password, user.passwordHash);
    if (!isMatch) {
      throw ApiError.unauthorized('Invalid phone number or password.');
    }

    if (user.status !== 'ACTIVE') {
      throw ApiError.forbidden('Account is suspended or inactive.');
    }

    user.lastLoginAt = new Date();
    await user.save();

    const token = this.generateToken(user);

    return {
      user: {
        id: user._id,
        name: user.name,
        phone: user.phone,
        email: user.email,
        activeStoreId: user.activeStoreId,
        roles: user.roles
      },
      token
    };
  }

  static async getMe(userId) {
    const user = await User.findById(userId).populate('roles.roleId').populate('activeStoreId');
    if (!user) {
      throw ApiError.notFound('User profile not found');
    }

    return {
      id: user._id,
      name: user.name,
      phone: user.phone,
      email: user.email,
      activeStore: user.activeStoreId,
      roles: user.roles
    };
  }

  static async switchActiveStore(userId, storeId) {
    const user = await User.findById(userId);
    if (!user) {
      throw ApiError.notFound('User profile not found');
    }

    const hasAccess = user.roles.some((r) => r.storeId && r.storeId.toString() === storeId);
    if (!hasAccess) {
      throw ApiError.forbidden('You do not have access to switch to this store.');
    }

    user.activeStoreId = storeId;
    await user.save();

    const token = this.generateToken(user);

    return {
      activeStoreId: storeId,
      token
    };
  }
}
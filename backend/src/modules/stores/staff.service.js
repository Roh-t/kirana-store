import { User } from '../users/user.model.js';
import { Role } from '../roles/role.model.js';
import { Store } from './store.model.js';
import { SubscriptionService } from '../subscriptions/subscription.service.js';
import { ApiError } from '../../utils/apiError.js';
import bcrypt from 'bcryptjs';

export class StaffService {
  static async addStaffToStore(storeId, ownerUserId, validatedData) {
    // ENFORCE SAAS STAFF LIMIT
    await SubscriptionService.enforceStaffLimit(storeId);

    const { name, phone, roleName } = validatedData;

    const store = await Store.findOne({ _id: storeId, ownerId: ownerUserId });
    if (!store) {
      throw ApiError.forbidden('Only store owners can invite staff members.');
    }

    let role = await Role.findOne({ name: roleName });
    if (!role) {
      role = await Role.create({
        name: roleName,
        displayName: roleName.replace('_', ' '),
        isSystemRole: true,
        permissions: []
      });
    }

    let staffUser = await User.findOne({ phone });
    if (!staffUser) {
      const salt = await bcrypt.genSalt(10);
      const defaultHash = await bcrypt.hash('kirana123', salt);

      staffUser = await User.create({
        name,
        phone,
        passwordHash: defaultHash,
        status: 'ACTIVE'
      });
    }

    const existingAssignment = staffUser.roles.find(
      (r) => r.storeId && r.storeId.toString() === storeId.toString()
    );

    if (existingAssignment) {
      existingAssignment.roleId = role._id;
    } else {
      staffUser.roles.push({
        storeId,
        roleId: role._id
      });
    }

    staffUser.activeStoreId = storeId;
    await staffUser.save();

    return staffUser;
  }

  static async getStoreStaff(storeId) {
    const users = await User.find({ 'roles.storeId': storeId })
      .select('name phone email status roles activeStoreId createdAt')
      .populate('roles.roleId', 'name displayName');

    return users.map((u) => {
      const storeRole = u.roles.find((r) => r.storeId && r.storeId.toString() === storeId.toString());
      return {
        id: u._id,
        name: u.name,
        phone: u.phone,
        status: u.status,
        role: storeRole?.roleId?.displayName || storeRole?.roleId?.name || 'Staff Member',
        roleCode: storeRole?.roleId?.name || 'STAFF',
        joinedAt: u.createdAt
      };
    });
  }

  static async removeStaffFromStore(storeId, ownerUserId, staffUserId) {
    const store = await Store.findOne({ _id: storeId, ownerId: ownerUserId });
    if (!store) {
      throw ApiError.forbidden('Only store owners can remove staff members.');
    }

    if (ownerUserId.toString() === staffUserId.toString()) {
      throw ApiError.badRequest('Store owner cannot be removed from staff list.');
    }

    const staffUser = await User.findById(staffUserId);
    if (!staffUser) {
      throw ApiError.notFound('Staff member not found');
    }

    staffUser.roles = staffUser.roles.filter((r) => !r.storeId || r.storeId.toString() !== storeId.toString());
    await staffUser.save();

    return { staffUserId, removed: true };
  }
}
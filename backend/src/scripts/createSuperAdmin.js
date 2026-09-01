import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { env } from '../config/env.js';
import { User } from '../modules/users/user.model.js';
import { Role } from '../modules/roles/role.model.js';
import { SYSTEM_ROLES } from '../constants/roles.js';

const { SUPER_ADMIN_NAME, SUPER_ADMIN_PHONE, SUPER_ADMIN_EMAIL, SUPER_ADMIN_PASSWORD } = process.env;

if (!SUPER_ADMIN_NAME || !SUPER_ADMIN_PHONE || !SUPER_ADMIN_PASSWORD) {
  console.error('Missing SUPER_ADMIN_NAME, SUPER_ADMIN_PHONE, or SUPER_ADMIN_PASSWORD.');
  process.exit(1);
}

try {
  await mongoose.connect(env.mongoUri);

  const role = await Role.findOneAndUpdate(
    { name: SYSTEM_ROLES.SUPER_ADMIN, isSystemRole: true },
    {
      name: SYSTEM_ROLES.SUPER_ADMIN,
      displayName: 'Super Admin',
      description: 'Global platform administration',
      isSystemRole: true,
      permissions: []
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  const passwordHash = await bcrypt.hash(SUPER_ADMIN_PASSWORD, 12);
  const user = await User.findOneAndUpdate(
    { phone: SUPER_ADMIN_PHONE },
    {
      name: SUPER_ADMIN_NAME,
      phone: SUPER_ADMIN_PHONE,
      email: SUPER_ADMIN_EMAIL || null,
      passwordHash,
      status: 'ACTIVE',
      $addToSet: { roles: { storeId: null, roleId: role._id } }
    },
    { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true }
  );

  console.log(`Super Admin ready: ${user.phone}`);
} finally {
  await mongoose.disconnect();
}
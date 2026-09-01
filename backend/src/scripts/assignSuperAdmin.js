import mongoose from 'mongoose';
import { env } from '../config/env.js';
import { User } from '../modules/users/user.model.js';
import { Role } from '../modules/roles/role.model.js';

const userId = process.argv[2];

if (!userId) {
  console.error('Usage: node src/scripts/assignSuperAdmin.js <user-id>');
  process.exit(1);
}

try {
  await mongoose.connect(env.mongoUri);

  let role = await Role.findOne({ name: 'SUPER_ADMIN', isSystemRole: true });
  if (!role) {
    role = await Role.create({
      name: 'SUPER_ADMIN',
      displayName: 'Super Admin',
      description: 'Global platform administration',
      isSystemRole: true,
      permissions: []
    });
  }

  const user = await User.findById(userId);
  if (!user) {
    throw new Error('User ID not found');
  }

  const alreadyAssigned = user.roles.some(
    (entry) => entry.roleId && entry.roleId.toString() === role._id.toString()
  );

  if (!alreadyAssigned) {
    user.roles.push({ storeId: null, roleId: role._id });
    await user.save();
  }

  console.log(`Super Admin role ready for ${user.phone}`);
} finally {
  await mongoose.disconnect();
}
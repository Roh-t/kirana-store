import mongoose from 'mongoose';

const userStoreRoleSchema = new mongoose.Schema(
  {
    storeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Store', required: true },
    roleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Role', required: true },
    assignedAt: { type: Date, default: Date.now }
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 100 },
    phone: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      match: [/^\+91[6-9]\d{9}$/, 'Please provide a valid Indian mobile number (+91XXXXXXXXXX)']
    },
    email: {
      type: String,
      lowercase: true,
      trim: true,
      sparse: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address']
    },
    passwordHash: { type: String, required: true, select: false },
    roles: [userStoreRoleSchema],
    activeStoreId: { type: mongoose.Schema.Types.ObjectId, ref: 'Store', default: null },
    status: {
      type: String,
      enum: ['ACTIVE', 'INACTIVE', 'SUSPENDED'],
      default: 'ACTIVE',
      index: true
    },
    lastLoginAt: { type: Date, default: null }
  },
  { timestamps: true }
);

// userSchema.index({ phone: 1 });
// userSchema.index({ status: 1 });
userSchema.index({ 'roles.storeId': 1 });

export const User = mongoose.model('User', userSchema);
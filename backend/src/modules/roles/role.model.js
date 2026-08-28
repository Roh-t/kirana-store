import mongoose from 'mongoose';

const roleSchema = new mongoose.Schema(
  {
    storeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Store', default: null, index: true },
    name: { type: String, required: true, uppercase: true, trim: true },
    displayName: { type: String, required: true, trim: true, maxlength: 50 },
    description: { type: String, trim: true, default: null },
    isSystemRole: { type: Boolean, default: false },
    permissions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Permission' }]
  },
  { timestamps: true }
);

roleSchema.index({ storeId: 1, name: 1 }, { unique: true });

export const Role = mongoose.model('Role', roleSchema);
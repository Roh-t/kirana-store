import mongoose from 'mongoose';

const customerSchema = new mongoose.Schema(
  {
    storeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Store', required: true, index: true },
    phone: {
      type: String,
      required: true,
      trim: true,
      match: [/^\+91[6-9]\d{9}$/, 'Please provide a valid Indian mobile number']
    },
    name: { type: String, trim: true, default: 'Guest Customer', maxlength: 100 },
    email: { type: String, lowercase: true, trim: true, default: null },
    address: {
      street: { type: String, trim: true, default: null },
      landmark: { type: String, trim: true, default: null },
      pincode: { type: String, trim: true, default: null }
    },
    totalOrders: { type: Number, default: 0, min: 0 },
    totalSpent: { type: Number, default: 0, min: 0 },
    udharBalance: { type: Number, default: 0, index: true },
    lastOrderAt: { type: Date, default: null },
    isGuest: { type: Boolean, default: false },
    status: { type: String, enum: ['ACTIVE', 'BLOCKED'], default: 'ACTIVE' }
  },
  { timestamps: true }
);

customerSchema.index({ storeId: 1, phone: 1 }, { unique: true });

export const Customer = mongoose.model('Customer', customerSchema);
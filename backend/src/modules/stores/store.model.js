import mongoose from 'mongoose';

const storeSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
      match: [/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens']
    },
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true},
    phone: {
      type: String,
      required: true,
      trim: true,
      match: [/^\+91[6-9]\d{9}$/, 'Please provide a valid contact number']
    },
    logoUrl: { type: String, default: null },
    address: {
      street: { type: String, required: true, trim: true, maxlength: 200 },
      city: { type: String, required: true, trim: true, index: true },
      state: { type: String, required: true, trim: true },
      pincode: {
        type: String,
        required: true,
        trim: true,
        match: [/^\d{6}$/, 'Please provide a valid 6-digit Indian PIN code'],
        index: true
      },
      landmark: { type: String, trim: true, default: null }
    },
    businessConfig: {
      currency: { type: String, default: 'INR' },
      timezone: { type: String, default: 'Asia/Kolkata' },
      isAcceptingOrders: { type: Boolean, default: true },
      minOrderValue: { type: Number, default: 0, min: 0 },
      autoAcceptOrders: { type: Boolean, default: false },
      enableDelivery: { type: Boolean, default: true },
      enablePickup: { type: Boolean, default: true }
    },
    taxConfig: {
      gstin: {
        type: String,
        trim: true,
        uppercase: true,
        sparse: true,
        match: [/^\d{2}[A-Z]{5}\d{4}[A-Z]{1}[A-Z\d]{1}[Z]{1}[A-Z\d]{1}$/, 'Invalid GSTIN format']
      },
      isTaxInclusive: { type: Boolean, default: true }
    },
    qrConfig: {
      upiId: { type: String, trim: true, default: null },
      payeeName: { type: String, trim: true, default: null }
    },
    subscriptionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subscription', default: null },
    status: {
      type: String,
      enum: ['PENDING_VERIFICATION', 'ACTIVE', 'SUSPENDED', 'INACTIVE'],
      default: 'ACTIVE',
      index: true
    }
  },
  { timestamps: true }
);

storeSchema.index({ slug: 1, status: 1 });


export const Store = mongoose.model('Store', storeSchema);
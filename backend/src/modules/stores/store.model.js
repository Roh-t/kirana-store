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
      enablePickup: { type: Boolean, default: true },
      preparationMinutes: { type: Number, default: 10, min: 1 },
      bufferMinutes: { type: Number, default: 0, min: 0 },
      workerCount: { type: Number, default: 1, min: 1 }
      ,manualClosureReason: { type: String, default: null, maxlength: 200, trim: true }
      ,weeklySchedule: {
        type: [{
          _id: false,
          dayOfWeek: { type: Number, min: 0, max: 6, required: true },
          isOpen: { type: Boolean, default: true },
          openTime: { type: String, default: '09:00', match: /^([01]\d|2[0-3]):[0-5]\d$/ },
          closeTime: { type: String, default: '21:00', match: /^([01]\d|2[0-3]):[0-5]\d$/ }
        }],
        default: () => Array.from({ length: 7 }, (_, dayOfWeek) => ({ dayOfWeek, isOpen: true, openTime: '09:00', closeTime: '21:00' }))
      }
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
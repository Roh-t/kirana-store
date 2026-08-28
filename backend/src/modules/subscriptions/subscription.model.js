import mongoose from 'mongoose';

const subscriptionSchema = new mongoose.Schema(
  {
    storeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Store', required: true, unique: true, index: true },
    plan: {
      type: String,
      enum: ['FREE', 'BASIC', 'PRO', 'PREMIUM'],
      default: 'FREE',
      index: true
    },
    status: {
      type: String,
      enum: ['TRIAL', 'ACTIVE', 'PAST_DUE', 'CANCELLED', 'EXPIRED'],
      default: 'TRIAL',
      index: true
    },
    startDate: { type: Date, default: Date.now },
    endDate: { type: Date, required: true, index: true },
    trialEndsAt: { type: Date, default: null },
    externalSubscriptionId: { type: String, trim: true, default: null, sparse: true },
    maxProducts: { type: Number, default: 100 },
    maxStaffUsers: { type: Number, default: 2 }
  },
  { timestamps: true }
);

subscriptionSchema.index({ status: 1, endDate: 1 });

export const Subscription = mongoose.model('Subscription', subscriptionSchema);
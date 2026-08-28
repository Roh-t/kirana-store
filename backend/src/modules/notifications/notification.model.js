import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    storeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Store', required: true, index: true },
    recipientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null, index: true },
    type: {
      type: String,
      enum: ['NEW_ORDER', 'ORDER_STATUS_CHANGE', 'LOW_STOCK_ALERT', 'SYSTEM'],
      required: true,
      index: true
    },
    channel: {
      type: String,
      enum: ['IN_APP', 'SMS', 'WHATSAPP', 'PUSH'],
      default: 'IN_APP'
    },
    title: { type: String, required: true, trim: true, maxlength: 100 },
    message: { type: String, required: true, trim: true, maxlength: 500 },
    data: { type: Object, default: null },
    isRead: { type: Boolean, default: false, index: true },
    readAt: { type: Date, default: null }
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

// 30-Day Auto Cleanup TTL Index
notificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 2592000 });
notificationSchema.index({ storeId: 1, recipientId: 1, isRead: 1, createdAt: -1 });

export const Notification = mongoose.model('Notification', notificationSchema);
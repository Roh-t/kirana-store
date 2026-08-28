import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema(
  {
    storeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Store', required: true, index: true },
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true, index: true },
    paymentNumber: { type: String, required: true, index: true },
    amount: { type: Number, required: true, min: 0.01 },
    method: {
      type: String,
      enum: ['CASH', 'UPI', 'CARD', 'ONLINE', 'UDHAR', 'OTHER'],
      required: true,
      index: true
    },
    status: {
      type: String,
      enum: ['PENDING', 'SUCCESS', 'FAILED', 'REFUNDED'],
      default: 'PENDING',
      index: true
    },
    gateway: {
      type: String,
      enum: ['MANUAL', 'RAZORPAY', 'CASHFREE', 'PAYTM'],
      default: 'MANUAL'
    },
    transactionId: { type: String, trim: true, default: null, sparse: true },
    gatewayResponse: { type: Object, default: null },
    receivedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
  },
  { timestamps: true }
);

paymentSchema.index({ storeId: 1, orderId: 1 });
paymentSchema.index({ storeId: 1, status: 1, createdAt: -1 });

export const Payment = mongoose.model('Payment', paymentSchema);
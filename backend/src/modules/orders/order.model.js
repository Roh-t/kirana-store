import mongoose from 'mongoose';

const orderItemSnapshotSchema = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    nameSnapshot: { type: String, required: true, trim: true },
    unitSnapshot: { type: String, required: true },
    mrpSnapshot: { type: Number, required: true, min: 0 },
    sellingPriceSnapshot: { type: Number, required: true, min: 0 },
    purchasePriceSnapshot: { type: Number, default: 0, min: 0 },
    taxRateSnapshot: { type: Number, default: 0, min: 0 },
    quantity: { type: Number, required: true, min: 0.001 },
    lineSubTotal: { type: Number, required: true, min: 0 },
    lineTaxAmount: { type: Number, default: 0, min: 0 },
    lineGrandTotal: { type: Number, required: true, min: 0 }
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    storeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Store', required: true, index: true },
    orderNumber: { type: String, required: true, index: true },
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true, index: true },
    customerDetails: {
      name: { type: String, required: true, trim: true },
      phone: { type: String, required: true, trim: true },
      deliveryAddress: { type: String, default: null }
    },
    orderType: {
      type: String,
      enum: ['PICKUP', 'STORE_COUNTER', 'DELIVERY'],
      required: true,
      index: true
    },
    items: {
      type: [orderItemSnapshotSchema],
      validate: [array => array.length > 0, 'Order must contain at least one line item']
    },
    subTotal: { type: Number, required: true, min: 0 },
    discountTotal: { type: Number, default: 0, min: 0 },
    taxTotal: { type: Number, default: 0, min: 0 },
    deliveryFee: { type: Number, default: 0, min: 0 },
    grandTotal: { type: Number, required: true, min: 0 },
    paymentStatus: {
      type: String,
      enum: ['PENDING', 'PAID', 'PARTIALLY_PAID', 'REFUNDED', 'FAILED'],
      default: 'PENDING',
      index: true
    },
    orderStatus: {
      type: String,
      enum: ['PENDING', 'ACCEPTED', 'PREPARING', 'PACKING', 'READY', 'COMPLETED', 'CANCELLED'],
      default: 'PENDING',
      index: true
    },
    stockDeducted: { type: Boolean, default: false }, // Tracks automated inventory deduction
    cancellationReason: { type: String, default: null },
    notes: { type: String, default: null, maxlength: 300 },
    estimatedReadyAt: { type: Date, default: null },
    fulfilledBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    completedAt: { type: Date, default: null }
  },
  { timestamps: true }
);

orderSchema.index({ storeId: 1, orderNumber: 1 }, { unique: true });
orderSchema.index({ storeId: 1, orderStatus: 1, createdAt: -1 });
orderSchema.index({ storeId: 1, customerId: 1, createdAt: -1 });

export const Order = mongoose.model('Order', orderSchema);
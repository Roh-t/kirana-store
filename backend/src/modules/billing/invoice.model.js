import mongoose from 'mongoose';

const invoiceSchema = new mongoose.Schema(
  {
    storeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Store', required: true, index: true },
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true, unique: true, index: true },
    invoiceNumber: { type: String, required: true, index: true },
    customerSnapshot: {
      name: { type: String, required: true },
      phone: { type: String, required: true }
    },
    subTotal: { type: Number, required: true, min: 0 },
    taxTotal: { type: Number, default: 0, min: 0 },
    discountTotal: { type: Number, default: 0, min: 0 },
    grandTotal: { type: Number, required: true, min: 0 },
    pdfUrl: { type: String, default: null },
    generatedAt: { type: Date, default: Date.now }
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

invoiceSchema.index({ storeId: 1, invoiceNumber: 1 }, { unique: true });

export const Invoice = mongoose.model('Invoice', invoiceSchema);
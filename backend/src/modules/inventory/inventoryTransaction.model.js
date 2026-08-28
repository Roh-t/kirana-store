import mongoose from 'mongoose';

const inventoryTransactionSchema = new mongoose.Schema(
  {
    storeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Store', required: true, index: true },
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
    type: {
      type: String,
      enum: ['PURCHASE', 'SALE', 'ADJUSTMENT', 'RETURN', 'DAMAGE', 'CORRECTION'],
      required: true,
      index: true
    },
    quantityDelta: { type: Number, required: true },
    previousStock: { type: Number, required: true, min: 0 },
    newStock: { type: Number, required: true, min: 0 },
    referenceId: { type: mongoose.Schema.Types.ObjectId, default: null },
    reason: { type: String, trim: true, default: null, maxlength: 250 },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

inventoryTransactionSchema.index({ storeId: 1, productId: 1, createdAt: -1 });
inventoryTransactionSchema.index({ storeId: 1, type: 1, createdAt: -1 });

export const InventoryTransaction = mongoose.model('InventoryTransaction', inventoryTransactionSchema);